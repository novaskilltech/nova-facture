import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { entity: true, client: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await request.json()

    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 })
    }

    if (invoice.status === "emitted" || invoice.status === "paid") {
      return NextResponse.json({ error: "Facture émise non modifiable" }, { status: 403 })
    }

    if (data.number && data.number !== invoice.number) {
      const existing = await prisma.invoice.findUnique({ where: { number: data.number } })
      if (existing) {
        return NextResponse.json({ error: "Numéro de facture déjà utilisé" }, { status: 400 })
      }
    }

    const quantity = data.quantity !== undefined
      ? Math.max(1, parseInt(data.quantity, 10) || 1)
      : invoice.quantity
    const unitPriceHT = data.amountHT !== undefined
      ? parseFloat(data.amountHT)
      : invoice.amountHT / Math.max(invoice.quantity, 1)
    const totalHT = quantity * unitPriceHT

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(data.number && { number: data.number }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.periodStart !== undefined && { periodStart: data.periodStart ? new Date(data.periodStart) : null }),
        ...(data.periodEnd !== undefined && { periodEnd: data.periodEnd ? new Date(data.periodEnd) : null }),
        ...(data.description && { description: data.description }),
        ...((data.quantity !== undefined || data.amountHT !== undefined) && {
          quantity,
          amountHT: totalHT,
          totalTTC: totalHT,
        }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.paymentLink !== undefined && { paymentLink: data.paymentLink }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status === "emitted" && { status: "emitted", emittedAt: new Date() }),
        ...(data.status && data.status !== "emitted" && { status: data.status }),
      },
      include: { entity: true, client: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
  }
}

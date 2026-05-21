import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const invoices = await prisma.invoice.findMany({
      include: { entity: true, client: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(invoices)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const quantity = Math.max(1, parseInt(data.quantity, 10) || 1)
    const unitPriceHT = parseFloat(data.amountHT)
    const totalHT = quantity * unitPriceHT

    const existing = await prisma.invoice.findUnique({ where: { number: data.number } })
    if (existing) {
      return NextResponse.json({ error: "Numéro de facture déjà utilisé" }, { status: 400 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        number: data.number,
        date: new Date(data.date),
        periodStart: data.periodStart ? new Date(data.periodStart) : null,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
        description: data.description,
        quantity,
        amountHT: totalHT,
        tvaRate: 0,
        tvaAmount: 0,
        totalTTC: totalHT,
        status: data.status || "draft",
        paymentMethod: data.paymentMethod,
        paymentLink: data.paymentLink || null,
        notes: data.notes || null,
        entityId: data.entityId,
        clientId: data.clientId,
      },
      include: { entity: true, client: true },
    })

    return NextResponse.json(invoice)
  } catch (error: unknown) {
    const message = error instanceof Error && "code" in error && error.code === "P2002"
      ? "Numéro de facture déjà utilisé"
      : "Erreur lors de la création"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clientId = searchParams.get("clientId")
    const entityId = searchParams.get("entityId")
    const search = searchParams.get("search")

    const where: any = {}
    if (status && status !== "all") {
      where.status = status
    }
    if (clientId && clientId !== "all") {
      where.clientId = clientId
    }
    if (entityId && entityId !== "all") {
      where.entityId = entityId
    }
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { invoice: { number: { contains: search } } },
        { client: { lastName: { contains: search } } },
        { client: { firstName: { contains: search } } },
        { client: { company: { contains: search } } },
      ]
    }

    const creditNotes = await prisma.creditNote.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, number: true, totalTTC: true, status: true, date: true },
        },
        client: true,
        entity: true,
        items: true,
        refunds: {
          orderBy: { refundDate: "desc" },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(creditNotes)
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
    const body = await request.json()
    const {
      number,
      invoiceId,
      date,
      reason,
      reasonDetails,
      type, // total, partial
      amountHT,
      tvaRate = 0,
      tvaAmount = 0,
      totalTTC,
      items = [],
      notes,
    } = body

    if (!number || !invoiceId || !reason || totalTTC === undefined || totalTTC <= 0) {
      return NextResponse.json({ error: "Champs obligatoires manquants ou montant invalide" }, { status: 400 })
    }

    // 1. Vérification de la facture existante et de ses avoirs déjà émis
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        creditNotes: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Facture d'origine introuvable" }, { status: 404 })
    }

    if (invoice.status === "cancelled" || invoice.status === "credited") {
      return NextResponse.json(
        { error: "Cette facture est déjà totalement annulée ou créditée." },
        { status: 400 }
      )
    }

    // Calcul du montant déjà crédité
    const alreadyCredited = invoice.creditNotes.reduce((sum, cn) => sum + cn.totalTTC, 0)
    const remainingAvailable = Math.round((invoice.totalTTC - alreadyCredited) * 100) / 100

    if (totalTTC > remainingAvailable + 0.01) {
      return NextResponse.json(
        {
          error: `Le montant de l'avoir (${totalTTC.toFixed(2)} €) dépasse le montant restant disponible sur cette facture (${remainingAvailable.toFixed(2)} €).`,
        },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du numéro d'avoir
    const existing = await prisma.creditNote.findUnique({
      where: { number: number.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Le numéro d'avoir ${number} est déjà utilisé.` },
        { status: 409 }
      )
    }

    // 2. Création de l'avoir et des items
    const creditNote = await prisma.creditNote.create({
      data: {
        number: number.trim(),
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        entityId: invoice.entityId,
        date: date ? new Date(date) : new Date(),
        reason,
        reasonDetails: reasonDetails || null,
        type: type || (totalTTC >= remainingAvailable - 0.01 ? "total" : "partial"),
        amountHT: parseFloat(amountHT) || totalTTC,
        tvaRate: parseFloat(tvaRate) || 0,
        tvaAmount: parseFloat(tvaAmount) || 0,
        totalTTC: parseFloat(totalTTC),
        status: "pending", // À rembourser
        notes: notes || null,
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            description: item.description || "Prestation",
            quantity: parseInt(item.quantity, 10) || 1,
            unitPriceHT: parseFloat(item.unitPriceHT) || 0,
            taxRate: parseFloat(item.taxRate) || 0,
            totalHT: parseFloat(item.totalHT) || 0,
            totalTTC: parseFloat(item.totalTTC) || 0,
          })),
        },
      },
      include: {
        items: true,
        invoice: true,
        client: true,
        entity: true,
      },
    })

    // 3. Mise à jour du statut de la facture d'origine
    const newTotalCredited = alreadyCredited + parseFloat(totalTTC)
    const isFullyCredited = newTotalCredited >= invoice.totalTTC - 0.01

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: isFullyCredited ? "credited" : "partial_credit_note",
      },
    })

    return NextResponse.json(creditNote)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur lors de la création de l'avoir" }, { status: 500 })
  }
}


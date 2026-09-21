import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      amount,
      refundDate,
      paymentMethod,
      transactionReference,
      notes,
    } = body

    const refundAmount = parseFloat(amount)
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: "Montant de remboursement invalide" }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Mode de remboursement obligatoire" }, { status: 400 })
    }

    // 1. Récupérer l'avoir et ses remboursements existants
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: { refunds: true },
    })

    if (!creditNote) {
      return NextResponse.json({ error: "Avoir introuvable" }, { status: 404 })
    }

    const alreadyRefunded = creditNote.refunds.reduce((sum, r) => sum + r.amount, 0)
    const remainingToRefund = Math.round((creditNote.totalTTC - alreadyRefunded) * 100) / 100

    if (refundAmount > remainingToRefund + 0.01) {
      return NextResponse.json(
        {
          error: `Le montant (${refundAmount.toFixed(2)} €) dépasse le solde restant à rembourser (${remainingToRefund.toFixed(2)} €).`,
        },
        { status: 400 }
      )
    }

    // 2. Créer le remboursement
    const refund = await prisma.refund.create({
      data: {
        creditNoteId: creditNote.id,
        amount: refundAmount,
        refundDate: refundDate ? new Date(refundDate) : new Date(),
        paymentMethod,
        transactionReference: transactionReference || null,
        notes: notes || null,
        createdById: userId,
      },
    })

    // 3. Mettre à jour le statut de l'avoir
    const newTotalRefunded = alreadyRefunded + refundAmount
    const isFullyRefunded = newTotalRefunded >= creditNote.totalTTC - 0.01

    await prisma.creditNote.update({
      where: { id: creditNote.id },
      data: {
        status: isFullyRefunded ? "refunded" : "partially_refunded",
      },
    })

    return NextResponse.json(refund)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 })
  }
}


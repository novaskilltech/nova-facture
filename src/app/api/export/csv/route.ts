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

    const headers = [
      "Numéro",
      "Date",
      "Entité",
      "Payeur",
      "Description",
      "Quantité",
      "Période début",
      "Période fin",
      "Montant HT",
      "TVA",
      "Total TTC",
      "Statut",
      "Moyen de paiement",
      "Créée le",
    ]

    const statusLabels: Record<string, string> = {
      draft: "Brouillon",
      emitted: "Émise",
      paid: "Payée",
      late: "En retard",
      cancelled: "Annulée",
    }

    const paymentLabels: Record<string, string> = {
      virement: "Virement",
      especes: "Espèces",
      "cb-stripe": "CB Stripe",
      "cb-revolut": "CB Revolut",
    }

    const rows = invoices.map((inv) => [
      inv.number,
      new Date(inv.date).toLocaleDateString("fr-FR"),
      inv.entity.commercialName,
      inv.client.firstName
        ? `${inv.client.firstName} ${inv.client.lastName}`
        : inv.client.lastName,
      inv.description,
      String(inv.quantity),
      inv.periodStart ? new Date(inv.periodStart).toLocaleDateString("fr-FR") : "",
      inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString("fr-FR") : "",
      inv.amountHT.toFixed(2),
      inv.tvaAmount.toFixed(2),
      inv.totalTTC.toFixed(2),
      statusLabels[inv.status] || inv.status,
      paymentLabels[inv.paymentMethod] || inv.paymentMethod,
      new Date(inv.createdAt).toLocaleDateString("fr-FR"),
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    return new NextResponse("\uFEFF" + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="factures-export.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

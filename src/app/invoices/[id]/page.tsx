import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { InvoicePDFDownloadButton } from "@/components/InvoicePDFDownloadButton"
import { InvoiceStatusSelector } from "@/components/InvoiceStatusSelector"
import { AppHeader } from "@/components/AppHeader"
import { DeleteDraftInvoiceButton } from "@/components/DeleteDraftInvoiceButton"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { entity: true, client: true },
  })

  if (!invoice) {
    notFound()
  }

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      virement: "Virement bancaire",
      especes: "Espèces",
      "cb-stripe": "CB via Stripe",
      "cb-revolut": "CB via Revolut Pro",
    }
    return methods[method] || method
  }

  const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    emitted: "Émise",
    paid: "Payée",
    late: "En retard",
    cancelled: "Annulée",
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    emitted: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    late: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  }

  const pdfInvoice = {
    number: invoice.number,
    date: invoice.date.toISOString(),
    periodStart: invoice.periodStart?.toISOString() || null,
    periodEnd: invoice.periodEnd?.toISOString() || null,
    description: invoice.description,
    quantity: invoice.quantity,
    amountHT: invoice.amountHT,
    tvaRate: invoice.tvaRate,
    tvaAmount: invoice.tvaAmount,
    totalTTC: invoice.totalTTC,
    paymentMethod: invoice.paymentMethod,
    paymentLink: invoice.paymentLink,
    notes: invoice.notes,
    entity: invoice.entity,
    client: invoice.client,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        links={[
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold">Facture {invoice.number}</h2>
            <p className="text-gray-500">
              {invoice.entity.commercialName}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:shrink-0">
            <InvoicePDFDownloadButton
              invoice={pdfInvoice}
              fileName={`facture-${invoice.number}.pdf`}
            />
            {invoice.status === "draft" && (
              <>
                <Link
                  href={`/invoices/${invoice.id}/edit`}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-center font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto sm:py-2"
                >
                  Modifier
                </Link>
                <EmitButton id={invoice.id} />
                <DeleteDraftInvoiceButton id={invoice.id} />
              </>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[invoice.status]}`}
            >
              {statusLabels[invoice.status]}
            </span>
            <span className="text-sm text-gray-500">
              Créée le {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
            </span>
            {invoice.emittedAt && (
              <span className="text-sm text-gray-500">
                Émise le {new Date(invoice.emittedAt).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-500 uppercase">Émetteur</h3>
              <p className="font-medium">{invoice.entity.legalName}</p>
              <p className="text-sm text-gray-600">{invoice.entity.commercialName}</p>
              <p className="text-sm text-gray-600">{invoice.entity.legalForm}</p>
              <p className="text-sm text-gray-600">
                {invoice.entity.address}, {invoice.entity.postalCode} {invoice.entity.city}
              </p>
              <p className="text-sm text-gray-600">
                SIREN {invoice.entity.siren}
                {invoice.entity.siret && ` - SIRET ${invoice.entity.siret}`}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-500 uppercase">Payeur</h3>
              <p className="font-medium">
                {invoice.client.firstName
                  ? `${invoice.client.firstName} ${invoice.client.lastName}`
                  : invoice.client.lastName}
              </p>
              {invoice.client.company && (
                <p className="text-sm text-gray-600">{invoice.client.company}</p>
              )}
              {invoice.client.email && (
                <p className="text-sm text-gray-600">{invoice.client.email}</p>
              )}
              {invoice.client.address && (
                <p className="text-sm text-gray-600">
                  {invoice.client.address}
                  {invoice.client.postalCode && `, ${invoice.client.postalCode}`}
                  {invoice.client.city && ` ${invoice.client.city}`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <h3 className="font-semibold mb-4">Détails</h3>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-500">Date de facture:</span>
              <p className="font-medium">
                {new Date(invoice.date).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Période de séjour:</span>
              <p className="font-medium">
                {invoice.periodStart && invoice.periodEnd
                  ? `Du ${new Date(invoice.periodStart).toLocaleDateString("fr-FR")} au ${new Date(invoice.periodEnd).toLocaleDateString("fr-FR")}`
                  : "Non spécifiée"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Moyen de paiement:</span>
              <p className="font-medium">{formatPaymentMethod(invoice.paymentMethod)}</p>
            </div>
            <div>
              <span className="text-gray-500">Quantité de produits:</span>
              <p className="font-medium">{invoice.quantity}</p>
            </div>
            <div>
              <span className="text-gray-500">Statut:</span>
              <InvoiceStatusSelector id={invoice.id} currentStatus={invoice.status} />
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p>{invoice.description}</p>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full sm:w-64">
              <div className="flex justify-between gap-4 py-1 text-sm">
                <span>Total HT</span>
                <span>{invoice.amountHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between gap-4 py-1 text-sm text-gray-500">
                <span>TVA (0%)</span>
                <span>0.00 €</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2 text-lg font-bold">
                <span>Total à payer</span>
                <span>{invoice.totalTTC.toFixed(2)} €</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 italic">
                {invoice.entity.tvaMention}
              </p>
            </div>
          </div>
        </div>

        {invoice.paymentMethod === "virement" && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
            <h3 className="font-semibold mb-4">Coordonnées bancaires</h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-500">Banque:</span>
                <p className="font-medium">{invoice.entity.bankName}</p>
              </div>
              <div>
                <span className="text-gray-500">Titulaire:</span>
                <p className="font-medium">{invoice.entity.bankHolder}</p>
              </div>
              <div>
                <span className="text-gray-500">IBAN:</span>
                <p className="break-all font-mono font-medium">{invoice.entity.bankIban}</p>
              </div>
              <div>
                <span className="text-gray-500">BIC:</span>
                <p className="break-all font-mono font-medium">{invoice.entity.bankBic}</p>
              </div>
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
            <h3 className="font-semibold mb-2">Notes internes</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        <div className="rounded-lg bg-white p-4 text-xs leading-relaxed text-gray-600 shadow sm:p-6">
          <p>
            TVA non applicable, conformément à l&apos;article 293 B du Code général des impôts (CGI), l&apos;entreprise bénéficiant du régime de la franchise en base de TVA.
          </p>
          <p className="mt-2">
            Nos conditions générales de vente sont consultables sur le site omrayanair.com.
          </p>
          <p className="mt-2">
            Le règlement total ou partiel de la présente facture emporte acceptation pleine et entière de nos conditions générales de vente. Conformément à ces conditions, aucune annulation ni aucun remboursement ne pourra être accordé après paiement total ou partiel de la facture.
          </p>
        </div>
      </main>
    </div>
  )
}

function EmitButton({ id }: { id: string }) {
  async function emitInvoice() {
    "use server"
    await requireAuth()
    
    await prisma.invoice.update({
      where: { id },
      data: {
        status: "emitted",
        emittedAt: new Date(),
      },
    })
    
    revalidatePath(`/invoices/${id}`)
  }

  return (
    <form action={emitInvoice} className="w-full sm:w-auto">
      <button
        type="submit"
        className="w-full rounded-md bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 sm:w-auto sm:py-2"
      >
        Émettre la facture
      </button>
    </form>
  )
}

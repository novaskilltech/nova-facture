import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"
import { CreditNotePDFDownloadButton } from "@/components/CreditNotePDFDownloadButton"
import { RefundModal } from "@/components/RefundModal"

export default async function CreditNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const creditNote = await prisma.creditNote.findUnique({
    where: { id },
    include: {
      entity: true,
      client: true,
      invoice: true,
      items: true,
      refunds: {
        orderBy: { refundDate: "desc" },
      },
    },
  })

  if (!creditNote) {
    notFound()
  }

  const totalRefunded = creditNote.refunds.reduce((sum, r) => sum + r.amount, 0)
  const remainingToRefund = Math.max(0, Math.round((creditNote.totalTTC - totalRefunded) * 100) / 100)

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      virement: "Virement bancaire",
      especes: "Espèces",
      "cb-stripe": "Remboursement Stripe",
      "cb-revolut": "Virement Revolut Pro",
      cheque: "Chèque",
      autre: "Autre",
    }
    return methods[method] || method
  }

  const statusLabels: Record<string, string> = {
    pending: "À rembourser",
    partially_refunded: "Partiellement remboursé",
    refunded: "Intégralement remboursé",
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    partially_refunded: "bg-blue-100 text-blue-800 border-blue-200",
    refunded: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/credit-notes", label: "Avoirs" },
          { href: "/clients", label: "Payeurs" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Entête de page */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/credit-notes" className="hover:underline">
                Avoirs
              </Link>
              <span>/</span>
              <span className="text-slate-800">{creditNote.number}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-rose-600">
                Avoir {creditNote.number}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[creditNote.status]}`}
              >
                {statusLabels[creditNote.status] || creditNote.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RefundModal
              creditNoteId={creditNote.id}
              creditNoteNumber={creditNote.number}
              remainingToRefund={remainingToRefund}
            />
            <CreditNotePDFDownloadButton creditNote={creditNote} />
          </div>
        </div>

        {/* Bloc Liaison Facture d'origine */}
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Facture d&apos;origine liée
            </p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              Facture {creditNote.invoice.number}
            </p>
            <p className="text-xs text-slate-500">
              Date facture : {new Date(creditNote.invoice.date).toLocaleDateString("fr-FR")} • Montant initial :{" "}
              {creditNote.invoice.totalTTC.toFixed(2)} €
            </p>
          </div>
          <Link
            href={`/invoices/${creditNote.invoice.id}`}
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-xs hover:bg-rose-50 transition-colors text-center"
          >
            Consulter la facture ➔
          </Link>
        </div>

        {/* Détails Émetteur & Payeur */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Émetteur
              </h3>
              <p className="font-bold text-slate-900">{creditNote.entity.commercialName}</p>
              <p className="text-xs text-slate-600">{creditNote.entity.legalName}</p>
              <p className="text-xs text-slate-500 mt-1">
                {creditNote.entity.address}, {creditNote.entity.postalCode} {creditNote.entity.city}
              </p>
              <p className="text-xs text-slate-500">SIREN : {creditNote.entity.siren}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Bénéficiaire / Client
              </h3>
              <p className="font-bold text-slate-900">
                {creditNote.client.company ||
                  (creditNote.client.firstName
                    ? `${creditNote.client.firstName} ${creditNote.client.lastName}`
                    : creditNote.client.lastName)}
              </p>
              {creditNote.client.email && (
                <p className="text-xs text-slate-500">{creditNote.client.email}</p>
              )}
              {creditNote.client.address && (
                <p className="text-xs text-slate-500">
                  {creditNote.client.address}, {creditNote.client.postalCode} {creditNote.client.city}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Détails comptables et lignes */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">Date d&apos;avoir</span>
              <span className="font-semibold text-sm text-slate-800">
                {new Date(creditNote.date).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">Type d&apos;avoir</span>
              <span className="font-semibold text-sm text-slate-800 uppercase">
                {creditNote.type === "total" ? "Avoir Total" : "Avoir Partiel"}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase block">Motif</span>
              <span className="font-semibold text-sm text-slate-800">{creditNote.reason}</span>
            </div>
          </div>

          {creditNote.reasonDetails && (
            <div className="mb-6 p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-800">
              <span className="font-bold">Précision du motif : </span>
              {creditNote.reasonDetails}
            </div>
          )}

          {/* Table des items */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Désignation</th>
                  <th className="py-2.5 text-center">Qté</th>
                  <th className="py-2.5 text-right">P.U. HT</th>
                  <th className="py-2.5 text-right">Total TTC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {creditNote.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-slate-800">{item.description}</td>
                    <td className="py-2.5 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-2.5 text-right text-slate-600">{item.unitPriceHT.toFixed(2)} €</td>
                    <td className="py-2.5 text-right font-bold text-rose-600">
                      -{item.totalTTC.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux & Reste */}
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Montant HT crédité</span>
                <span>-{creditNote.amountHT.toFixed(2)} €</span>
              </div>
              {creditNote.tvaAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>TVA ({creditNote.tvaRate}%)</span>
                  <span>-{creditNote.tvaAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-rose-600 border-t border-slate-100 pt-2">
                <span>Total Avoir TTC</span>
                <span>-{creditNote.totalTTC.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-600 pt-1">
                <span>Montant remboursé</span>
                <span>{totalRefunded.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 border-t border-dashed border-slate-200 pt-1 text-sm">
                <span>Reste à rembourser</span>
                <span className={remainingToRefund > 0 ? "text-amber-600" : "text-slate-500"}>
                  {remainingToRefund.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des remboursements (Cash out) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Historique des remboursements financiers
              </h3>
              <p className="text-xs text-slate-500">
                Décaissements réels effectués en faveur du client.
              </p>
            </div>
          </div>

          {creditNote.refunds.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Aucun remboursement financier n&apos;a encore été enregistré pour cet avoir.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {creditNote.refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">
                        {refund.amount.toFixed(2)} €
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-medium">
                        {formatPaymentMethod(refund.paymentMethod)}
                      </span>
                      {refund.transactionReference && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                          Réf: {refund.transactionReference}
                        </span>
                      )}
                    </div>
                    {refund.notes && (
                      <p className="text-slate-400 mt-1 italic">{refund.notes}</p>
                    )}
                  </div>
                  <div className="text-slate-400 text-right">
                    Payé le {new Date(refund.refundDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

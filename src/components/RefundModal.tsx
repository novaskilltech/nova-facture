"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface RefundModalProps {
  creditNoteId: string
  creditNoteNumber: string
  remainingToRefund: number
}

const PAYMENT_METHODS = [
  { value: "virement", label: "Virement bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "cb-stripe", label: "Remboursement Stripe (CB)" },
  { value: "cb-revolut", label: "Virement Revolut Pro" },
  { value: "cheque", label: "Chèque" },
  { value: "autre", label: "Autre moyen" },
]

export function RefundModal({
  creditNoteId,
  creditNoteNumber,
  remainingToRefund,
}: RefundModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(remainingToRefund.toFixed(2))
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = useState("virement")
  const [transactionReference, setTransactionReference] = useState("")
  const [notes, setNotes] = useState("")

  const parsedAmount = parseFloat(amount) || 0

  const handleOpen = () => {
    setAmount(remainingToRefund.toFixed(2))
    setError(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (parsedAmount <= 0) {
      setError("Le montant à rembourser doit être supérieur à 0 €.")
      return
    }

    if (parsedAmount > remainingToRefund + 0.01) {
      setError(
        `Le montant (${parsedAmount.toFixed(2)} €) ne peut pas excéder le reste à rembourser (${remainingToRefund.toFixed(2)} €).`
      )
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/credit-notes/${creditNoteId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          refundDate,
          paymentMethod,
          transactionReference: transactionReference || null,
          notes: notes || null,
        }),
      })

      if (res.ok) {
        setIsOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de l'enregistrement du remboursement")
      }
    } catch {
      setError("Erreur de communication avec le serveur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={remainingToRefund <= 0.01}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-premium transition-premium hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
      >
        Enregistrer un remboursement
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Enregistrer un remboursement
                </h3>
                <p className="text-xs text-slate-500">
                  Avoir {creditNoteNumber} • Reste à rembourser :{" "}
                  <span className="font-bold text-slate-800">{remainingToRefund.toFixed(2)} €</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Montant remboursé (€)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingToRefund}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-base font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(remainingToRefund.toFixed(2))}
                    className="shrink-0 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                  >
                    Solde total
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date du remboursement
                  </label>
                  <input
                    type="date"
                    value={refundDate}
                    onChange={(e) => setRefundDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    required
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Référence de transaction (virement, ID Stripe, etc.)
                </label>
                <input
                  type="text"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Ex : VIR-2026-0921, chq n°..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notes internes (facultatif)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Informations complémentaires pour la comptabilité..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || parsedAmount <= 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Validation..." : "Valider le décaissement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

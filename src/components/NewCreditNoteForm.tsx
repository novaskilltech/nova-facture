"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface NewCreditNoteFormProps {
  invoice: any
  suggestedNumber: string
}

const REASONS = [
  "Annulation de prestation",
  "Remboursement client",
  "Erreur de facturation",
  "Modification de réservation",
  "Prestation non réalisée",
  "Geste commercial",
  "Autre",
]

export function NewCreditNoteForm({ invoice, suggestedNumber }: NewCreditNoteFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcul du montant déjà crédité
  const alreadyCredited = (invoice.creditNotes || []).reduce((sum: number, cn: any) => sum + cn.totalTTC, 0)
  const remainingAvailable = Math.max(0, Math.round((invoice.totalTTC - alreadyCredited) * 100) / 100)

  const [creditNoteNumber, setCreditNoteNumber] = useState(suggestedNumber)
  const [creditNoteDate, setCreditNoteDate] = useState(new Date().toISOString().split("T")[0])
  const [type, setType] = useState<"total" | "partial">("total")
  const [reason, setReason] = useState(REASONS[0])
  const [reasonDetails, setReasonDetails] = useState("")
  const [notes, setNotes] = useState("")

  // Montant direct pour l'avoir
  const [amountTTC, setAmountTTC] = useState<string>(remainingAvailable.toString())
  const [customDescription, setCustomDescription] = useState<string>(
    `Avoir sur facture ${invoice.number} - Annulation de prestation`
  )

  useEffect(() => {
    if (type === "total") {
      setAmountTTC(remainingAvailable.toFixed(2))
      setCustomDescription(`Avoir total sur facture ${invoice.number}`)
    } else {
      setCustomDescription(`Avoir partiel sur facture ${invoice.number}`)
    }
  }, [type, remainingAvailable, invoice.number])

  const parsedAmountTTC = parseFloat(amountTTC) || 0
  const remainingAfterCredit = Math.max(0, remainingAvailable - parsedAmountTTC)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (parsedAmountTTC <= 0) {
      setError("Le montant de l'avoir doit être supérieur à 0 €.")
      return
    }

    if (parsedAmountTTC > remainingAvailable + 0.01) {
      setError(
        `Le montant de l'avoir (${parsedAmountTTC.toFixed(2)} €) ne peut pas dépasser le solde disponible (${remainingAvailable.toFixed(2)} €).`
      )
      return
    }

    const confirmMsg = `Confirmez-vous la création de cet avoir de ${parsedAmountTTC.toFixed(2)} € sur la facture ${invoice.number} ? Cette action est irréversible comptablement.`
    if (!window.confirm(confirmMsg)) return

    try {
      setSubmitting(true)
      const res = await fetch("/api/credit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: creditNoteNumber,
          invoiceId: invoice.id,
          date: creditNoteDate,
          reason,
          reasonDetails: reason === "Autre" ? reasonDetails : (reasonDetails || null),
          type,
          amountHT: parsedAmountTTC, // TVA 0 ou calculée selon facture
          tvaRate: 0,
          tvaAmount: 0,
          totalTTC: parsedAmountTTC,
          items: [
            {
              description: customDescription || `Avoir sur facture ${invoice.number}`,
              quantity: 1,
              unitPriceHT: parsedAmountTTC,
              taxRate: 0,
              totalHT: parsedAmountTTC,
              totalTTC: parsedAmountTTC,
            },
          ],
          notes: notes || null,
        }),
      })

      if (res.ok) {
        const created = await res.json()
        router.push(`/credit-notes/${created.id}`)
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la création de l'avoir")
      }
    } catch {
      setError("Erreur de communication avec le serveur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* Récapitulatif comptable de la facture d'origine */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
          Situation de la Facture {invoice.number}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Montant initial</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {invoice.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Déjà crédité</p>
            <p className="text-lg font-black text-amber-600 mt-0.5">
              {alreadyCredited.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Disponible pour avoir</p>
            <p className="text-lg font-black text-blue-700 mt-0.5">
              {remainingAvailable.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Solde après cet avoir</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">
              {remainingAfterCredit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </p>
          </div>
        </div>
      </div>

      {/* Choix du type d'avoir (Total ou Partiel) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Type d&apos;avoir</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setType("total")}
            className={`p-4 rounded-xl border-2 text-left transition-premium cursor-pointer ${
              type === "total"
                ? "border-blue-600 bg-blue-50/30 text-blue-900"
                : "border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            <p className="font-black text-sm">Avoir Total</p>
            <p className="text-xs text-slate-500 mt-1">
              Annule la totalité du solde disponible restant ({remainingAvailable.toFixed(2)} €).
            </p>
          </button>

          <button
            type="button"
            onClick={() => setType("partial")}
            className={`p-4 rounded-xl border-2 text-left transition-premium cursor-pointer ${
              type === "partial"
                ? "border-blue-600 bg-blue-50/30 text-blue-900"
                : "border-slate-200 hover:border-slate-300 text-slate-700"
            }`}
          >
            <p className="font-black text-sm">Avoir Partiel</p>
            <p className="text-xs text-slate-500 mt-1">
              Saisir librement le montant ou la prestation à rembourser/créditer.
            </p>
          </button>
        </div>
      </div>

      {/* Détails de l'avoir */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Paramètres de l&apos;avoir</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Numéro d&apos;avoir
            </label>
            <input
              type="text"
              value={creditNoteNumber}
              onChange={(e) => setCreditNoteNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date d&apos;émission
            </label>
            <input
              type="date"
              value={creditNoteDate}
              onChange={(e) => setCreditNoteDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Motif de l&apos;avoir (Obligatoire)
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            required
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {reason === "Autre" && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Précisez le motif
            </label>
            <input
              type="text"
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Ex : Remise commerciale négociée suite à modification de vol..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Montant TTC de l&apos;avoir (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={remainingAvailable}
            value={amountTTC}
            disabled={type === "total"}
            onChange={(e) => setAmountTTC(e.target.value)}
            className={`w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base font-black outline-none transition-premium ${
              type === "total"
                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                : "bg-slate-50/50 text-slate-900 focus:border-blue-500 focus:bg-white"
            }`}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Plafond maximum autorisé pour cette facture : {remainingAvailable.toFixed(2)} €
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Libellé / Désignation de la ligne
          </label>
          <input
            type="text"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Notes internes (Facultatif)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Commentaires internes sur les circonstances de l'avoir..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href={`/invoices/${invoice.id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={submitting || parsedAmountTTC <= 0 || parsedAmountTTC > remainingAvailable + 0.01}
          className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-premium transition-premium hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Validation en cours..." : `Valider l'avoir de ${parsedAmountTTC.toFixed(2)} €`}
        </button>
      </div>
    </form>
  )
}


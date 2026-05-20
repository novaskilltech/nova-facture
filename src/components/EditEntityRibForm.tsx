"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface EntityRib {
  id: string
  bankName: string
  bankIban: string
  bankBic: string
  bankHolder: string
}

interface EditEntityRibFormProps {
  entity: EntityRib
}

// Outils de formatage et validation
function formatIBAN(value: string): string {
  const raw = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const parts = raw.match(/.{1,4}/g)
  return parts ? parts.join(' ') : raw
}

function validateIBAN(iban: string): boolean {
  const raw = iban.replace(/\s+/g, '')
  // Expression régulière générique pour l'IBAN (2 lettres pays, 2 chiffres contrôle, puis 12 à 30 alphanumériques)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{12,30}$/
  return ibanRegex.test(raw)
}

function formatBIC(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11)
}

function validateBIC(bic: string): boolean {
  const raw = bic.trim()
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/
  return bicRegex.test(raw)
}

export function EditEntityRibForm({ entity }: EditEntityRibFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    bankName: entity.bankName,
    bankIban: formatIBAN(entity.bankIban),
    bankBic: formatBIC(entity.bankBic),
    bankHolder: entity.bankHolder,
  })

  // États de validation à la saisie
  const isIbanValid = form.bankIban ? validateIBAN(form.bankIban) : true
  const isBicValid = form.bankBic ? validateBIC(form.bankBic) : true

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    
    // Bloquer la soumission si formats invalides
    if (!validateIBAN(form.bankIban) || !validateBIC(form.bankBic)) {
      setError("Veuillez corriger les erreurs de format (IBAN ou BIC) avant d'enregistrer.")
      return
    }

    setSaving(true)
    setError("")

    // Nettoyer l'IBAN et le BIC pour stockage propre en base de données (sans espaces superflus)
    const cleanedForm = {
      ...form,
      bankIban: form.bankIban.replace(/\s+/g, ''),
      bankBic: form.bankBic.trim(),
    }

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanedForm),
    })

    if (response.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await response.json().catch(() => null)
      setError(data?.error || "Erreur lors de la modification du RIB")
    }

    setSaving(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-50/50 px-3 py-2 text-xs font-bold text-blue-600 transition-premium hover:bg-blue-50 hover:text-blue-700 cursor-pointer sm:px-4"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Modifier le RIB
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-4 backdrop-blur-sm transition-all duration-300 sm:items-center">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-all transform scale-100 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">Modifier les Coordonnées Bancaires</h3>
          <button 
            type="button" 
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-premium rounded-full p-1 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl mb-6 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Établissement Bancaire</label>
            <input
              type="text"
              placeholder="Ex: BNP Paribas, BoursoBank..."
              value={form.bankName}
              onChange={(event) => setForm({ ...form, bankName: event.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 rounded-xl text-slate-800 transition-premium outline-none font-medium text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Titulaire du Compte</label>
            <input
              type="text"
              placeholder="Nom complet ou raison sociale"
              value={form.bankHolder}
              onChange={(event) => setForm({ ...form, bankHolder: event.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 rounded-xl text-slate-800 transition-premium outline-none font-medium text-sm"
              required
            />
          </div>
          <div>
            <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Numéro IBAN</label>
              {form.bankIban && (
                <span className={`text-[10px] font-bold ${isIbanValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isIbanValid ? 'Format IBAN correct' : 'Format IBAN invalide'}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="FR76 3000 6000 ..."
              value={form.bankIban}
              onChange={(event) => setForm({ ...form, bankIban: formatIBAN(event.target.value) })}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${form.bankIban && !isIbanValid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/10'} focus:bg-white rounded-xl text-slate-800 font-mono tracking-wider transition-premium outline-none text-sm`}
              required
            />
          </div>
          <div>
            <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Code BIC / SWIFT</label>
              {form.bankBic && (
                <span className={`text-[10px] font-bold ${isBicValid ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isBicValid ? 'Format BIC correct' : 'Format BIC invalide'}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Ex: BNPAFRPPXXX"
              value={form.bankBic}
              onChange={(event) => setForm({ ...form, bankBic: formatBIC(event.target.value) })}
              className={`w-full px-4 py-2.5 bg-slate-50 border ${form.bankBic && !isBicValid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/10'} focus:bg-white rounded-xl text-slate-800 font-mono tracking-wider transition-premium outline-none text-sm`}
              required
            />
          </div>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError("")
                setForm({
                  bankName: entity.bankName,
                  bankIban: formatIBAN(entity.bankIban),
                  bankBic: formatBIC(entity.bankBic),
                  bankHolder: entity.bankHolder,
                })
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-premium cursor-pointer text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !isIbanValid || !isBicValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl transition-premium shadow-premium shadow-blue-500/10 cursor-pointer disabled:cursor-not-allowed text-sm"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

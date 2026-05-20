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

export function EditEntityRibForm({ entity }: EditEntityRibFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    bankName: entity.bankName,
    bankIban: entity.bankIban,
    bankBic: entity.bankBic,
    bankHolder: entity.bankHolder,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")

    const response = await fetch(`/api/entities/${entity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
        className="text-blue-600 hover:underline text-sm"
      >
        Modifier le RIB
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">Modifier le RIB</h3>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Banque</label>
            <input
              type="text"
              value={form.bankName}
              onChange={(event) => setForm({ ...form, bankName: event.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Titulaire</label>
            <input
              type="text"
              value={form.bankHolder}
              onChange={(event) => setForm({ ...form, bankHolder: event.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IBAN</label>
            <input
              type="text"
              value={form.bankIban}
              onChange={(event) => setForm({ ...form, bankIban: event.target.value })}
              className="w-full px-3 py-2 border rounded-md font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">BIC</label>
            <input
              type="text"
              value={form.bankBic}
              onChange={(event) => setForm({ ...form, bankBic: event.target.value })}
              className="w-full px-3 py-2 border rounded-md font-mono"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError("")
                setForm({
                  bankName: entity.bankName,
                  bankIban: entity.bankIban,
                  bankBic: entity.bankBic,
                  bankHolder: entity.bankHolder,
                })
              }}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

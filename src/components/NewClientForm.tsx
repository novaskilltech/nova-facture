"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function NewClientForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    notes: "",
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setOpen(false)
      setForm({
        lastName: "",
        firstName: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        postalCode: "",
        city: "",
        notes: "",
      })
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 sm:w-auto sm:py-2"
      >
        + Nouveau payeur
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Nouveau payeur</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nom *"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <input
              type="text"
              placeholder="Prénom"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <input
            type="text"
            placeholder="Entreprise"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            <input
              type="tel"
              placeholder="Téléphone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <input
            type="text"
            placeholder="Adresse"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Code postal"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Ville"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md border px-4 py-2.5 font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

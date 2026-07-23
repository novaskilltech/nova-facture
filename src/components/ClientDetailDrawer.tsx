"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export type ClientInvoiceSummary = {
  id: string
  number: string
  totalTTC: number
  status: string
  date: string | Date
}

export type ClientData = {
  id: string
  lastName: string
  firstName?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  notes?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
  invoices?: ClientInvoiceSummary[]
}

interface ClientDetailDrawerProps {
  client: ClientData | null
  onClose: () => void
  onClientUpdated?: (updated: ClientData) => void
}

export function ClientDetailDrawer({ client, onClose, onClientUpdated }: ClientDetailDrawerProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState<ClientData>({
    id: "",
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

  useEffect(() => {
    if (client) {
      setFormData({
        id: client.id,
        lastName: client.lastName || "",
        firstName: client.firstName || "",
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        postalCode: client.postalCode || "",
        city: client.city || "",
        notes: client.notes || "",
      })
      setIsEditing(false)
      setErrorMsg(null)
      setSuccessMsg(null)
    }
  }, [client])

  // Fermer la modale sur la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && client) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [client, onClose])

  if (!client) return null

  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      setSuccessMsg("Fiche client mise à jour avec succès !")
      setIsEditing(false)
      if (onClientUpdated) {
        onClientUpdated(data)
      }
      router.refresh()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg("Une erreur inattendue s'est produite.")
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">Payée</span>
      case "emitted":
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">Émise</span>
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">Annulée</span>
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">Brouillon</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn">
      {/* Background Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="pointer-events-auto w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-lg flex flex-col">
          
          {/* Drawer Header */}
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                  {client.company && (
                    <span className="inline-flex items-center rounded-md bg-slate-200/60 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {client.company}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">Fiche client • Réf #{client.id.slice(-6)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Controls / Tabs */}
            <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isEditing
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                👁️ Consultation
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isEditing
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ✏️ Modifier la fiche
              </button>
            </div>
          </div>

          {/* Toast notifications */}
          {errorMsg && (
            <div className="mx-6 mt-4 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200 flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mx-6 mt-4 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200 flex items-center gap-2">
              <span>✅</span> {successMsg}
            </div>
          )}

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">

            {!isEditing ? (
              /* VIEW MODE */
              <div className="space-y-6">
                
                {/* Contact Section */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Coordonnées</h3>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Email</span>
                      {client.email ? (
                        <a href={`mailto:${client.email}`} className="text-sm font-semibold text-blue-600 hover:underline break-all">
                          {client.email}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Non renseigné</span>
                      )}
                    </div>

                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Téléphone</span>
                      {client.phone ? (
                        <a href={`tel:${client.phone}`} className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                          {client.phone}
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Non renseigné</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Adresse de facturation</h3>
                  {client.address || client.city ? (
                    <div>
                      <p className="text-sm font-medium text-slate-800">{client.address || "-"}</p>
                      <p className="text-sm text-slate-600">
                        {[client.postalCode, client.city].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Adresse non renseignée</span>
                  )}
                </div>

                {/* Notes Section */}
                {client.notes && (
                  <div className="rounded-xl border border-slate-200/80 bg-amber-50/30 p-4 space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Notes & Remarques</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
                  </div>
                )}

                {/* Invoices Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Factures rattachées ({client.invoices?.length || 0})
                    </h3>
                  </div>

                  {client.invoices && client.invoices.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {client.invoices.map((inv) => (
                        <a
                          key={inv.id}
                          href={`/invoices?search=${encodeURIComponent(inv.number)}`}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                              N° {inv.number}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(inv.date).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-900">
                              {inv.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                            </span>
                            {getStatusBadge(inv.status)}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      Aucune facture enregistrée pour ce client.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      value={formData.firstName || ""}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Société / Entreprise</label>
                  <input
                    type="text"
                    value={formData.company || ""}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Code postal</label>
                    <input
                      type="text"
                      value={formData.postalCode || ""}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ville</label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Remarques</label>
                  <textarea
                    rows={3}
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                  >
                    {loading ? "Enregistrement..." : "Sauvegarder"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

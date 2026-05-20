"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Entity {
  id: string
  legalName: string
  commercialName: string
  legalForm: string
  siren: string
  siret?: string | null
  rcs?: string | null
  capital?: string | null
  address: string
  postalCode: string
  city: string
  tvaMention: string
  bankName: string
  bankIban: string
  bankBic: string
  bankHolder: string
  paymentMethods: string
}

interface Client {
  id: string
  lastName: string
  firstName?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [entities, setEntities] = useState<Entity[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [selectedEntity, setSelectedEntity] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [newClientModal, setNewClientModal] = useState(false)
  const [newClient, setNewClient] = useState({ lastName: "", firstName: "", company: "", email: "", phone: "", address: "", postalCode: "", city: "" })

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [amountHT, setAmountHT] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/entities").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/invoices/generate-number").then((r) => r.json()),
    ]).then(([entitiesData, clientsData, numberData]) => {
      setEntities(entitiesData)
      setClients(clientsData)
      setInvoiceNumber(numberData.number)
      setLoading(false)
    })
  }, [])

  const entity = entities.find((e) => e.id === selectedEntity)
  const availablePaymentMethods = entity
    ? entity.paymentMethods.split(",")
    : []
  const quantityValue = Math.max(1, parseInt(quantity || "1", 10) || 1)
  const unitPriceHT = parseFloat(amountHT || "0") || 0
  const totalHT = quantityValue * unitPriceHT

  async function handleCreateClient() {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      })
      if (res.ok) {
        const created = await res.json()
        setClients((prev) => [created, ...prev])
        setSelectedClient(created.id)
        setNewClientModal(false)
        setNewClient({ lastName: "", firstName: "", company: "", email: "", phone: "", address: "", postalCode: "", city: "" })
      }
    } catch {
      setError("Erreur lors de la création du payeur")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: invoiceNumber,
          date: invoiceDate,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          description,
          quantity: parseInt(quantity, 10),
          amountHT: parseFloat(amountHT),
          paymentMethod,
          paymentLink: paymentLink || null,
          notes: notes || null,
          entityId: selectedEntity,
          clientId: selectedClient,
          status: "draft",
        }),
      })

      if (res.ok) {
        const invoice = await res.json()
        router.push(`/invoices/${invoice.id}`)
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la création")
      }
    } catch {
      setError("Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nova Facture</h1>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Tableau de bord
          </Link>
          <Link href="/entities" className="text-blue-600 hover:underline">
            Sociétés
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-red-600 hover:underline">
              Déconnexion
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Nouvelle facture</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4">Entreprise émettrice</h3>
            <div className="grid grid-cols-2 gap-4">
              {entities.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    setSelectedEntity(e.id)
                    setPaymentMethod("")
                  }}
                  className={`p-4 border-2 rounded-lg text-left ${
                    selectedEntity === e.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium">{e.commercialName}</p>
                  <p className="text-sm text-gray-500">{e.legalName} - {e.legalForm}</p>
                </button>
              ))}
            </div>
          </div>

          {entity && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold mb-4">Payeur</h3>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-3"
                required
              >
                <option value="">Sélectionner un payeur</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName ? `${c.firstName} ${c.lastName}` : c.lastName}
                    {c.company ? ` (${c.company})` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewClientModal(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                + Nouveau payeur
              </button>
            </div>
          )}

          {entity && selectedClient && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Détails de la facture</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Numéro</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Début séjour</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fin séjour</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description du package</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                    placeholder="Prestation de services - Conciergerie..."
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Montant et paiement</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantité de produits</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix unitaire HT (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={amountHT}
                      onChange={(e) => setAmountHT(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Moyen de paiement</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      <option value="">Sélectionner</option>
                      {availablePaymentMethods.map((m) => (
                        <option key={m} value={m}>
                          {m === "virement" && "Virement bancaire"}
                          {m === "especes" && "Espèces"}
                          {m === "cb-stripe" && "CB via Stripe"}
                          {m === "cb-revolut" && "CB via Revolut Pro"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {(paymentMethod === "cb-stripe" || paymentMethod === "cb-revolut") && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Lien de paiement</label>
                    <input
                      type="url"
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                )}
                {amountHT && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span>Quantité</span>
                      <span>{quantityValue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Prix unitaire HT</span>
                      <span>{unitPriceHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total HT</span>
                      <span>{totalHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>TVA (0%)</span>
                      <span>0.00 €</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Total à payer</span>
                      <span>{totalHT.toFixed(2)} €</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Notes internes (facultatif)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="Notes internes..."
                />
              </div>
            </>
          )}

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 text-center px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedEntity || !selectedClient}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Création..." : "Créer la facture"}
            </button>
          </div>
        </form>
      </main>

      {newClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nouveau payeur</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom *"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
              <input
                type="text"
                placeholder="Entreprise"
                value={newClient.company}
                onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="email"
                placeholder="Email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Adresse"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Code postal"
                  value={newClient.postalCode}
                  onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={newClient.city}
                  onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setNewClientModal(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!newClient.lastName}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

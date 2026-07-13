"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/AppHeader"

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

interface CustomProduct {
  id: string
  name: string
  price: string
  quantity: string
}

const roomTypes = [
  { value: "single", label: "Single", supplement: 600 },
  { value: "double", label: "Double", supplement: 200 },
  { value: "triple", label: "Triple", supplement: 100 },
  { value: "quad", label: "Quad", supplement: 0 },
  { value: "quintuple", label: "Quintuple", supplement: 0 },
]

const departureAirports = ["Paris", "Marseille", "Lyon", "Bruxelles"]
const breakfastPricePerDay = 10

function formatStayDate(date: string) {
  if (!date) return ""
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR")
}

function calculateStayDays(periodStart: string, periodEnd: string) {
  if (!periodStart || !periodEnd) return 0

  const startDate = new Date(`${periodStart}T00:00:00`)
  const endDate = new Date(`${periodEnd}T00:00:00`)
  const durationInMs = endDate.getTime() - startDate.getTime()

  if (durationInMs <= 0) return 0

  return Math.ceil(durationInMs / (1000 * 60 * 60 * 24))
}

function buildProductDescription({
  periodStart,
  periodEnd,
  departureAirport,
  includeVisa,
  includeVisaKsaExtra,
  visaKsaAmount,
  visaKsaQuantity,
  roomType,
  includeBreakfast,
  customProducts,
}: {
  periodStart: string
  periodEnd: string
  departureAirport: string
  includeVisa: boolean
  includeVisaKsaExtra: boolean
  visaKsaAmount: string
  visaKsaQuantity: string
  roomType: string
  includeBreakfast: boolean
  customProducts: CustomProduct[]
}) {
  const stayPeriod = periodStart && periodEnd
    ? `du ${formatStayDate(periodStart)} au ${formatStayDate(periodEnd)}`
    : periodStart
      ? `à partir du ${formatStayDate(periodStart)}`
      : periodEnd
        ? `jusqu'au ${formatStayDate(periodEnd)}`
        : "dates de séjour à préciser"
  const room = roomTypes.find((type) => type.value === roomType)
  const roomLabel = room?.label || roomType
  const roomSupplement = room?.supplement || 0
  const stayDays = calculateStayDays(periodStart, periodEnd)
  const breakfastSupplement = includeBreakfast ? stayDays * breakfastPricePerDay : 0
  const breakfastLabel = includeBreakfast
    ? `inclus (${stayDays} jour${stayDays > 1 ? "s" : ""} x ${breakfastPricePerDay.toFixed(2)} € = ${breakfastSupplement.toFixed(2)} €)`
    : "non inclus"

  let visaLabel = "sans visa"
  if (includeVisa) {
    visaLabel = "Visa inclus (sans frais supplémentaires)"
  } else if (includeVisaKsaExtra) {
    const qtyVal = parseInt(visaKsaQuantity || "1", 10) || 1
    const priceVal = parseFloat(visaKsaAmount || "0") || 0
    visaLabel = `avec frais de visa KSA supplémentaire (${priceVal.toFixed(2)} € x ${qtyVal} = ${(priceVal * qtyVal).toFixed(2)} €)`
  }

  const lines = [
    `Prestations de services - accompagnement logistique ${stayPeriod}`,
    `Aéroport de départ: ${departureAirport}`,
    `Visa: ${visaLabel}`,
    `Hébergement: chambre ${roomLabel}`,
    `Supplément chambre: +${roomSupplement.toFixed(2)} €`,
    `Petit déjeuner: ${breakfastLabel}`,
  ]

  if (customProducts.length > 0) {
    lines.push("\nProduits additionnels :")
    customProducts.forEach((p) => {
      const priceVal = parseFloat(p.price || "0")
      const qtyVal = parseInt(p.quantity || "1", 10) || 1
      lines.push(`- ${p.name || "Produit sans nom"} : ${priceVal.toFixed(2)} € x ${qtyVal} = ${(priceVal * qtyVal).toFixed(2)} €`)
    })
  }

  return lines.join("\n")
}

function parseInvoiceDescription(description: string) {
  const result = {
    departureAirport: "Paris",
    includeVisa: false,
    includeVisaKsaExtra: false,
    visaKsaAmount: "",
    visaKsaQuantity: "1",
    roomType: "double",
    includeBreakfast: true,
    customProducts: [] as CustomProduct[],
  }

  if (!description) return result

  const airportMatch = description.match(/Aéroport de départ:\s*([^\r\n]+)/)
  if (airportMatch) {
    result.departureAirport = airportMatch[1].trim()
  }

  if (description.includes("Visa inclus")) {
    result.includeVisa = true
  } else if (description.includes("avec frais de visa KSA supplémentaire")) {
    result.includeVisaKsaExtra = true
    const visaMatch = description.match(/supplémentaire \(([\d.]+)\s*€\s*x\s*(\d+)/)
    if (visaMatch) {
      result.visaKsaAmount = visaMatch[1]
      result.visaKsaQuantity = visaMatch[2]
    }
  }

  const roomMatch = description.match(/Hébergement:\s*chambre\s*([^\r\n]+)/)
  if (roomMatch) {
    const label = roomMatch[1].trim()
    const found = roomTypes.find(t => t.label.toLowerCase() === label.toLowerCase())
    if (found) {
      result.roomType = found.value
    }
  }

  if (description.includes("Petit déjeuner: inclus")) {
    result.includeBreakfast = true
  } else if (description.includes("Petit déjeuner: non inclus")) {
    result.includeBreakfast = false
  }

  if (description.includes("Produits additionnels :")) {
    const lines = description.split("\n")
    const startIndex = lines.findIndex(l => l.includes("Produits additionnels :"))
    if (startIndex !== -1) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.startsWith("-")) {
          const match = line.match(/^-\s*(.*?)\s*:\s*([\d.]+)\s*€\s*x\s*(\d+)/)
          if (match) {
            result.customProducts.push({
              id: Math.random().toString(36).substring(2, 9),
              name: match[1].trim(),
              price: match[2],
              quantity: match[3],
            })
          }
        }
      }
    }
  }

  return result
}

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
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
  const [invoiceDate, setInvoiceDate] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [departureAirport, setDepartureAirport] = useState("Paris")
  const [includeVisa, setIncludeVisa] = useState(false)
  const [includeVisaKsaExtra, setIncludeVisaKsaExtra] = useState(false)
  const [visaKsaAmount, setVisaKsaAmount] = useState("")
  const [visaKsaQuantity, setVisaKsaQuantity] = useState("1")
  const [roomType, setRoomType] = useState("double")
  const [includeBreakfast, setIncludeBreakfast] = useState(true)
  const [quantity, setQuantity] = useState("1")
  const [amountHT, setAmountHT] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentLink, setPaymentLink] = useState("")
  const [notes, setNotes] = useState("")

  const [description, setDescription] = useState("")
  const [autoGenerateDescription, setAutoGenerateDescription] = useState(false)
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/entities").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch(`/api/invoices/${id}`).then((r) => r.json()),
    ]).then(([entitiesData, clientsData, invoiceData]) => {
      if (invoiceData.error) {
        setError(invoiceData.error)
        setLoading(false)
        return
      }

      if (invoiceData.status !== "draft") {
        setError("Seules les factures en brouillon peuvent être modifiées.")
        setLoading(false)
        return
      }

      setEntities(entitiesData)
      setClients(clientsData)

      // Hydrate state from invoice
      setSelectedEntity(invoiceData.entityId)
      setSelectedClient(invoiceData.clientId)
      setInvoiceNumber(invoiceData.number)
      setInvoiceDate(invoiceData.date ? invoiceData.date.split("T")[0] : "")
      setPeriodStart(invoiceData.periodStart ? invoiceData.periodStart.split("T")[0] : "")
      setPeriodEnd(invoiceData.periodEnd ? invoiceData.periodEnd.split("T")[0] : "")
      setDescription(invoiceData.description || "")
      setQuantity(invoiceData.quantity.toString())
      setPaymentMethod(invoiceData.paymentMethod || "")
      setPaymentLink(invoiceData.paymentLink || "")
      setNotes(invoiceData.notes || "")

      // Parse fields from description
      const parsed = parseInvoiceDescription(invoiceData.description || "")
      setDepartureAirport(parsed.departureAirport)
      setIncludeVisa(parsed.includeVisa)
      setIncludeVisaKsaExtra(parsed.includeVisaKsaExtra)
      setVisaKsaAmount(parsed.visaKsaAmount)
      setVisaKsaQuantity(parsed.visaKsaQuantity)
      setRoomType(parsed.roomType)
      setIncludeBreakfast(parsed.includeBreakfast)
      setCustomProducts(parsed.customProducts)

      // Calculate unitPriceHT hors chambre
      const qtyVal = invoiceData.quantity || 1
      const totalHTFromDB = invoiceData.amountHT // This is total HT from DB
      const customProductsTotal = parsed.customProducts.reduce((acc, p) => {
        const priceVal = parseFloat(p.price || "0") || 0
        const qtyVal = parseInt(p.quantity || "1", 10) || 1
        return acc + (priceVal * qtyVal)
      }, 0)

      const totalPackageHT = totalHTFromDB - customProductsTotal
      const packageUnitPriceHT = totalPackageHT / qtyVal

      const roomSupplement = roomTypes.find((type) => type.value === parsed.roomType)?.supplement || 0
      const stayDays = calculateStayDays(
        invoiceData.periodStart ? invoiceData.periodStart.split("T")[0] : "",
        invoiceData.periodEnd ? invoiceData.periodEnd.split("T")[0] : ""
      )
      const breakfastSupplement = parsed.includeBreakfast ? stayDays * breakfastPricePerDay : 0
      const visaKsaQtyVal = parseInt(parsed.visaKsaQuantity || "1", 10) || 1
      const visaKsaVal = parsed.includeVisaKsaExtra ? (parseFloat(parsed.visaKsaAmount || "0") || 0) * visaKsaQtyVal : 0

      const baseUnitPriceHT = packageUnitPriceHT - roomSupplement - breakfastSupplement - visaKsaVal
      setAmountHT(Math.max(0, baseUnitPriceHT).toFixed(2))

      setLoading(false)
    }).catch(() => {
      setError("Erreur lors du chargement des données")
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (autoGenerateDescription) {
      const generated = buildProductDescription({
        periodStart,
        periodEnd,
        departureAirport,
        includeVisa,
        includeVisaKsaExtra,
        visaKsaAmount,
        visaKsaQuantity,
        roomType,
        includeBreakfast,
        customProducts,
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(generated)
    }
  }, [
    autoGenerateDescription,
    periodStart,
    periodEnd,
    departureAirport,
    includeVisa,
    includeVisaKsaExtra,
    visaKsaAmount,
    visaKsaQuantity,
    roomType,
    includeBreakfast,
    customProducts,
  ])

  const entity = entities.find((e) => e.id === selectedEntity)
  const availablePaymentMethods = entity
    ? entity.paymentMethods.split(",")
    : []

  const roomSupplement = roomTypes.find((type) => type.value === roomType)?.supplement || 0
  const stayDays = calculateStayDays(periodStart, periodEnd)
  const breakfastSupplement = includeBreakfast ? stayDays * breakfastPricePerDay : 0
  const quantityValue = Math.max(1, parseInt(quantity || "1", 10) || 1)
  const baseUnitPriceHT = parseFloat(amountHT || "0") || 0
  const visaKsaQtyVal = parseInt(visaKsaQuantity || "1", 10) || 1
  const visaKsaVal = includeVisaKsaExtra ? (parseFloat(visaKsaAmount || "0") || 0) * visaKsaQtyVal : 0

  const customProductsTotal = customProducts.reduce((acc, p) => {
    const priceVal = parseFloat(p.price || "0") || 0
    const qtyVal = parseInt(p.quantity || "1", 10) || 1
    return acc + (priceVal * qtyVal)
  }, 0)

  const packageUnitPriceHT = baseUnitPriceHT + roomSupplement + breakfastSupplement + visaKsaVal
  const totalHT = (quantityValue * packageUnitPriceHT) + customProductsTotal

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
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: invoiceNumber,
          date: invoiceDate,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          description,
          quantity: quantityValue,
          amountHT: totalHT / quantityValue,
          paymentMethod,
          paymentLink: paymentLink || null,
          notes: notes || null,
          entityId: selectedEntity,
          clientId: selectedClient,
        }),
      })

      if (res.ok) {
        router.push(`/invoices/${id}`)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Erreur lors de la modification")
      }
    } catch {
      setError("Erreur lors de la modification")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        links={[
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="mb-6 text-2xl font-bold">Modifier la facture {invoiceNumber}</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {error.includes("brouillon") ? (
          <div className="flex gap-4">
            <Link
              href={`/invoices/${id}`}
              className="rounded-md border bg-white px-4 py-2 text-center font-medium hover:bg-gray-50"
            >
              Retour à la facture
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <h3 className="font-semibold mb-4">Entreprise émettrice</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {entities.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setSelectedEntity(e.id)
                      setPaymentMethod("")
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-premium ${
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
              <div className="rounded-lg bg-white p-4 shadow sm:p-6">
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
                  className="rounded-md px-1 py-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  + Nouveau payeur
                </button>
              </div>
            )}

            {entity && selectedClient && (
              <>
                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                  <h3 className="font-semibold mb-4">Détails de la facture</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <div>
                      <label className="block text-sm font-medium mb-1">Aéroport de départ</label>
                      <select
                        value={departureAirport}
                        onChange={(e) => setDepartureAirport(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        {departureAirports.map((airport) => (
                          <option key={airport} value={airport}>
                            {airport}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">Produits inclus</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2">
                        <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeVisa}
                            onChange={(e) => {
                              setIncludeVisa(e.target.checked)
                              if (e.target.checked) {
                                setIncludeVisaKsaExtra(false)
                                setVisaKsaAmount("")
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          Visa inclus
                        </label>
                      </div>
                      <div className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2">
                        <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeVisaKsaExtra}
                            onChange={(e) => {
                              setIncludeVisaKsaExtra(e.target.checked)
                              if (e.target.checked) {
                                setIncludeVisa(false)
                                setVisaKsaAmount("135")
                                setVisaKsaQuantity("1")
                              } else {
                                setVisaKsaAmount("")
                                setVisaKsaQuantity("1")
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          Supplément Visa KSA
                        </label>
                        {includeVisaKsaExtra && (
                          <div className="mt-1 flex gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-500 font-medium">Prix unitaire (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={visaKsaAmount}
                                onChange={(e) => setVisaKsaAmount(e.target.value)}
                                placeholder="135.00"
                                className="w-full px-2 py-1 text-sm border rounded-md"
                                required
                              />
                            </div>
                            <div className="w-16">
                              <label className="block text-[10px] text-gray-500 font-medium">Qté</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={visaKsaQuantity}
                                onChange={(e) => setVisaKsaQuantity(e.target.value)}
                                placeholder="1"
                                className="w-full px-2 py-1 text-sm border rounded-md"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Type de chambre</label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {roomTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label} (+{type.supplement.toFixed(2)} €)
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex min-h-11 items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium sm:mt-0">
                        <input
                          type="checkbox"
                          checked={includeBreakfast}
                          onChange={(e) => setIncludeBreakfast(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Petit déjeuner (+{breakfastPricePerDay.toFixed(2)} €/jour)
                      </label>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium">Description du package / Détail de la facture</label>
                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoGenerateDescription}
                          onChange={(e) => setAutoGenerateDescription(e.target.checked)}
                          className="h-3 w-3 rounded border-gray-300"
                        />
                        Générer automatiquement
                      </label>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        if (autoGenerateDescription) {
                          setAutoGenerateDescription(false)
                        }
                      }}
                      className="w-full px-3 py-2 border rounded-md text-slate-700 focus:ring-1 focus:ring-blue-500"
                      rows={6}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Vous pouvez modifier ce texte librement. Toute modification manuelle désactivera la génération automatique.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Produits additionnels</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomProducts((prev) => [
                          ...prev,
                          {
                            id: Math.random().toString(36).substr(2, 9),
                            name: "",
                            price: "",
                            quantity: "1",
                          },
                        ])
                      }}
                      className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-premium"
                    >
                      + Ajouter un produit
                    </button>
                  </div>

                  {customProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun produit additionnel ajouté.</p>
                  ) : (
                    <div className="space-y-4">
                      {customProducts.map((product, index) => (
                        <div key={product.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 border-b pb-4 sm:border-0 sm:pb-0">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nom du produit</label>
                            <input
                              type="text"
                              value={product.name}
                              onChange={(e) => {
                                const newProducts = [...customProducts]
                                newProducts[index].name = e.target.value
                                setCustomProducts(newProducts)
                              }}
                              placeholder="Ex: Assurance voyage"
                              className="w-full px-3 py-2 border rounded-md"
                              required
                            />
                          </div>
                          <div className="w-full sm:w-32">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Prix unitaire HT (€)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={product.price}
                              onChange={(e) => {
                                const newProducts = [...customProducts]
                                newProducts[index].price = e.target.value
                                setCustomProducts(newProducts)
                              }}
                              placeholder="0.00"
                              className="w-full px-3 py-2 border rounded-md"
                              required
                            />
                          </div>
                          <div className="w-full sm:w-24">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={product.quantity}
                              onChange={(e) => {
                                const newProducts = [...customProducts]
                                newProducts[index].quantity = e.target.value
                                setCustomProducts(newProducts)
                              }}
                              placeholder="1"
                              className="w-full px-3 py-2 border rounded-md"
                              required
                            />
                          </div>
                          <div className="flex items-end h-full sm:pt-5">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomProducts(customProducts.filter((p) => p.id !== product.id))
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
                  <h3 className="font-semibold mb-4">Montant et paiement</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                      <label className="block text-sm font-medium mb-1">Prix unitaire HT hors chambre (€)</label>
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
                    <div className="mt-4 rounded-md bg-gray-50 p-4">
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Quantité</span>
                        <span>{quantityValue}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Prix unitaire HT hors chambre</span>
                        <span>{baseUnitPriceHT.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Supplément chambre</span>
                        <span>+{roomSupplement.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Petit déjeuner ({stayDays} jour{stayDays > 1 ? "s" : ""})</span>
                        <span>+{breakfastSupplement.toFixed(2)} €</span>
                      </div>
                      {includeVisaKsaExtra && (
                        <div className="flex justify-between gap-4 text-sm">
                          <span>Supplément visa KSA</span>
                          <span>+{visaKsaVal.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 text-sm border-t pt-1 mt-1 font-medium">
                        <span>Prix unitaire HT total</span>
                        <span>{packageUnitPriceHT.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm">
                        <span>Total package HT</span>
                        <span>{(quantityValue * packageUnitPriceHT).toFixed(2)} €</span>
                      </div>
                      {customProducts.length > 0 && (
                        <div className="flex justify-between gap-4 text-sm">
                          <span>Total produits additionnels HT</span>
                          <span>{customProductsTotal.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 text-sm border-t pt-1 mt-1 font-semibold">
                        <span>Total HT</span>
                        <span>{totalHT.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between gap-4 text-sm text-gray-500">
                        <span>TVA (0%)</span>
                        <span>0.00 €</span>
                      </div>
                      <div className="mt-2 flex justify-between gap-4 border-t pt-2 font-bold text-lg">
                        <span>Total à payer</span>
                        <span>{totalHT.toFixed(2)} €</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-white p-4 shadow sm:p-6">
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

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
              <Link
                href={`/invoices/${id}`}
                className="flex-1 rounded-md border px-4 py-2.5 text-center font-medium hover:bg-gray-50"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedEntity || !selectedClient}
                className="flex-1 rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        )}
      </main>

      {newClientModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 shadow-lg sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Nouveau payeur</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nom *"
                  value={newClient.lastName}
                  onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Prénom"
                  value={newClient.firstName}
                  onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Code postal"
                  value={newClient.postalCode}
                  onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={newClient.city}
                  onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setNewClientModal(false)}
                className="flex-1 rounded-md border px-4 py-2.5 font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCreateClient}
                disabled={!newClient.lastName}
                className="flex-1 rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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

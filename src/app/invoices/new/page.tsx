"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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

interface CustomProduct {
  id: string
  name: string
  price: string
  quantity: string
  discountType?: string
  discountValue?: string
  discountName?: string
}

function formatLineDiscount(type?: string, value?: string, name?: string, basePrice?: number) {
  if (!type || type === "none" || !value || !basePrice) return ""
  const valFloat = parseFloat(value) || 0
  if (valFloat <= 0) return ""
  let discountAmount = 0
  let symbol = ""
  if (type === "percentage") {
    discountAmount = basePrice * (valFloat / 100)
    symbol = `${valFloat}%`
  } else {
    discountAmount = valFloat
    symbol = `${valFloat} €`
  }
  const label = name ? `${name} (-${symbol})` : `Remise (-${symbol})`
  return ` [Remise: ${label}: -${discountAmount.toFixed(2)} €]`
}

function parseLineDiscount(line: string) {
  const match = line.match(/\[Remise:\s*(.*?)\s*\((-?[\d.]+)(%| €)?\):\s*-?([\d.]+) €\]/)
  if (match) {
    const labelAndSymbol = match[1]
    const valStr = match[2]
    const isPercentage = match[3] === "%"
    
    // Extraire le nom en enlevant la parenthèse finale de fin s'il y a un symbole
    let name = labelAndSymbol
    if (labelAndSymbol.includes("(-")) {
      name = labelAndSymbol.split("(-")[0].trim()
    }
    
    return {
      discountType: isPercentage ? "percentage" : "amount",
      discountValue: valStr,
      discountName: name,
    }
  }
  return {
    discountType: "none",
    discountValue: "",
    discountName: "",
  }
}

function buildProductDescription({
  periodStart,
  periodEnd,
  departureAirport,
  includeVisa,
  includeVisaKsaExtra,
  visaKsaAmount,
  visaKsaQuantity,
  visaKsaDiscountType,
  visaKsaDiscountValue,
  visaKsaDiscountName,
  roomType,
  roomDiscountType,
  roomDiscountValue,
  roomDiscountName,
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
  visaKsaDiscountType?: string
  visaKsaDiscountValue?: string
  visaKsaDiscountName?: string
  roomType: string
  roomDiscountType?: string
  roomDiscountValue?: string
  roomDiscountName?: string
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
    const baseTotal = priceVal * qtyVal
    const discStr = formatLineDiscount(visaKsaDiscountType, visaKsaDiscountValue, visaKsaDiscountName, baseTotal)
    visaLabel = `avec frais de visa KSA supplémentaire (${priceVal.toFixed(2)} € x ${qtyVal} = ${baseTotal.toFixed(2)} €)${discStr}`
  }

  const roomDiscStr = formatLineDiscount(roomDiscountType, roomDiscountValue, roomDiscountName, roomSupplement)

  const lines = [
    `Prestations de services - accompagnement logistique ${stayPeriod}`,
    `Aéroport de départ: ${departureAirport}`,
    `Visa: ${visaLabel}`,
    `Hébergement: chambre ${roomLabel}`,
    `Supplément chambre: +${roomSupplement.toFixed(2)} €${roomDiscStr}`,
    `Petit déjeuner: ${breakfastLabel}`,
  ]

  if (customProducts.length > 0) {
    lines.push("\nProduits additionnels :")
    customProducts.forEach((p) => {
      const priceVal = parseFloat(p.price || "0")
      const qtyVal = parseInt(p.quantity || "1", 10) || 1
      const baseTotal = priceVal * qtyVal
      const discStr = formatLineDiscount(p.discountType, p.discountValue, p.discountName, baseTotal)
      lines.push(`- ${p.name || "Produit sans nom"} : ${priceVal.toFixed(2)} € x ${qtyVal} = ${baseTotal.toFixed(2)} €${discStr}`)
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
    visaKsaDiscountType: "none",
    visaKsaDiscountValue: "",
    visaKsaDiscountName: "",
    roomType: "double",
    roomDiscountType: "none",
    roomDiscountValue: "",
    roomDiscountName: "",
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
    const visaLine = description.split("\n").find(l => l.includes("Visa:") && l.includes("KSA"))
    if (visaLine) {
      const disc = parseLineDiscount(visaLine)
      result.visaKsaDiscountType = disc.discountType
      result.visaKsaDiscountValue = disc.discountValue
      result.visaKsaDiscountName = disc.discountName
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

  const roomLine = description.split("\n").find(l => l.includes("Supplément chambre:"))
  if (roomLine) {
    const disc = parseLineDiscount(roomLine)
    result.roomDiscountType = disc.discountType
    result.roomDiscountValue = disc.discountValue
    result.roomDiscountName = disc.discountName
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
            const disc = parseLineDiscount(line)
            result.customProducts.push({
              id: Math.random().toString(36).substring(2, 9),
              name: match[1].trim(),
              price: match[2],
              quantity: match[3],
              discountType: disc.discountType,
              discountValue: disc.discountValue,
              discountName: disc.discountName,
            })
          }
        }
      }
    }
  }

  return result
}

function NewInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const duplicateFrom = searchParams.get("duplicateFrom")
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
  const [autoGenerateDescription, setAutoGenerateDescription] = useState(true)
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([])

  const [visaKsaDiscountType, setVisaKsaDiscountType] = useState("none")
  const [visaKsaDiscountValue, setVisaKsaDiscountValue] = useState("")
  const [visaKsaDiscountName, setVisaKsaDiscountName] = useState("")

  const [roomDiscountType, setRoomDiscountType] = useState("none")
  const [roomDiscountValue, setRoomDiscountValue] = useState("")
  const [roomDiscountName, setRoomDiscountName] = useState("")

  const [discountType, setDiscountType] = useState("none")
  const [discountValue, setDiscountValue] = useState("")
  const [discountName, setDiscountName] = useState("")

  useEffect(() => {
    const promises = [
      fetch("/api/entities").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]
    if (duplicateFrom) {
      promises.push(fetch(`/api/invoices/${duplicateFrom}`).then((r) => r.json()))
    }

    Promise.all(promises).then(([entitiesData, clientsData, invoiceData]) => {
      setEntities(entitiesData)
      setClients(clientsData)

      if (invoiceData && !invoiceData.error) {
        setSelectedEntity(invoiceData.entityId)
        setSelectedClient(invoiceData.clientId)
        setQuantity(invoiceData.quantity.toString())
        setPaymentMethod(invoiceData.paymentMethod || "")
        setPaymentLink(invoiceData.paymentLink || "")
        setNotes(invoiceData.notes || "")
        setDescription(invoiceData.description || "")

        const parsed = parseInvoiceDescription(invoiceData.description || "")
        setDepartureAirport(parsed.departureAirport)
        setIncludeVisa(parsed.includeVisa)
        setIncludeVisaKsaExtra(parsed.includeVisaKsaExtra)
        setVisaKsaAmount(parsed.visaKsaAmount)
        setVisaKsaQuantity(parsed.visaKsaQuantity)
        setVisaKsaDiscountType(parsed.visaKsaDiscountType || "none")
        setVisaKsaDiscountValue(parsed.visaKsaDiscountValue || "")
        setVisaKsaDiscountName(parsed.visaKsaDiscountName || "")
        setRoomType(parsed.roomType)
        setRoomDiscountType(parsed.roomDiscountType || "none")
        setRoomDiscountValue(parsed.roomDiscountValue || "")
        setRoomDiscountName(parsed.roomDiscountName || "")
        setIncludeBreakfast(parsed.includeBreakfast)
        setCustomProducts(parsed.customProducts)

        setDiscountType(invoiceData.discountType || "none")
        setDiscountValue(invoiceData.discountValue ? invoiceData.discountValue.toString() : "")
        setDiscountName(invoiceData.discountName || "")

        const qtyVal = invoiceData.quantity || 1
        const totalHTFromDB = invoiceData.amountHT
        const customProductsTotal = parsed.customProducts.reduce((acc, p) => {
          const priceVal = parseFloat(p.price || "0") || 0
          const qtyVal = parseInt(p.quantity || "1", 10) || 1
          let prodTotal = priceVal * qtyVal
          if (p.discountType === "percentage") {
            prodTotal -= prodTotal * ((parseFloat(p.discountValue || "0") || 0) / 100)
          } else if (p.discountType === "amount") {
            prodTotal -= parseFloat(p.discountValue || "0") || 0
          }
          return acc + Math.max(0, prodTotal)
        }, 0)

        // Récupérer le total package HT brut avant sa propre remise globale
        let totalPackageHT = totalHTFromDB - customProductsTotal
        if (invoiceData.discountType === "percentage") {
          totalPackageHT = totalPackageHT / (1 - (invoiceData.discountValue || 0) / 100)
        } else if (invoiceData.discountType === "amount") {
          totalPackageHT = totalPackageHT + (invoiceData.discountValue || 0)
        }

        const packageUnitPriceHT = totalPackageHT / qtyVal

        const roomSupplement = roomTypes.find((type) => type.value === parsed.roomType)?.supplement || 0
        const stayDays = calculateStayDays(
          invoiceData.periodStart ? invoiceData.periodStart.split("T")[0] : "",
          invoiceData.periodEnd ? invoiceData.periodEnd.split("T")[0] : ""
        )
        const breakfastSupplement = parsed.includeBreakfast ? stayDays * breakfastPricePerDay : 0
        
        const visaKsaQtyVal = parseInt(parsed.visaKsaQuantity || "1", 10) || 1
        let visaKsaVal = parsed.includeVisaKsaExtra ? (parseFloat(parsed.visaKsaAmount || "0") || 0) * visaKsaQtyVal : 0
        if (parsed.visaKsaDiscountType === "percentage") {
          visaKsaVal -= visaKsaVal * ((parseFloat(parsed.visaKsaDiscountValue || "0") || 0) / 100)
        } else if (parsed.visaKsaDiscountType === "amount") {
          visaKsaVal -= parseFloat(parsed.visaKsaDiscountValue || "0") || 0
        }

        let roomSupplementVal = roomSupplement
        if (parsed.roomDiscountType === "percentage") {
          roomSupplementVal -= roomSupplementVal * ((parseFloat(parsed.roomDiscountValue || "0") || 0) / 100)
        } else if (parsed.roomDiscountType === "amount") {
          roomSupplementVal -= parseFloat(parsed.roomDiscountValue || "0") || 0
        }

        const baseUnitPriceHT = packageUnitPriceHT - roomSupplementVal - breakfastSupplement - visaKsaVal
        setAmountHT(Math.max(0, baseUnitPriceHT).toFixed(2))

        setPeriodStart(invoiceData.periodStart ? invoiceData.periodStart.split("T")[0] : "")
        setPeriodEnd(invoiceData.periodEnd ? invoiceData.periodEnd.split("T")[0] : "")
        setAutoGenerateDescription(false)
      }
      setLoading(false)
    }).catch(() => {
      setError("Erreur lors du chargement des données")
      setLoading(false)
    })
  }, [duplicateFrom])

  useEffect(() => {
    if (!selectedEntity) return

    fetch(`/api/invoices/generate-number?entityId=${encodeURIComponent(selectedEntity)}`)
      .then((response) => response.json())
      .then((numberData) => {
        if (numberData.number) {
          setInvoiceNumber(numberData.number)
        }
      })
      .catch(() => {
        setError("Erreur lors de la génération du numéro de facture")
      })
  }, [selectedEntity])

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
        visaKsaDiscountType,
        visaKsaDiscountValue,
        visaKsaDiscountName,
        roomType,
        roomDiscountType,
        roomDiscountValue,
        roomDiscountName,
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
    visaKsaDiscountType,
    visaKsaDiscountValue,
    visaKsaDiscountName,
    roomType,
    roomDiscountType,
    roomDiscountValue,
    roomDiscountName,
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

  let discountedVisaKsaVal = visaKsaVal
  if (visaKsaDiscountType === "percentage") {
    discountedVisaKsaVal -= visaKsaVal * ((parseFloat(visaKsaDiscountValue || "0") || 0) / 100)
  } else if (visaKsaDiscountType === "amount") {
    discountedVisaKsaVal -= parseFloat(visaKsaDiscountValue || "0") || 0
  }
  discountedVisaKsaVal = Math.max(0, discountedVisaKsaVal)

  let discountedRoomSupplement = roomSupplement
  if (roomDiscountType === "percentage") {
    discountedRoomSupplement -= roomSupplement * ((parseFloat(roomDiscountValue || "0") || 0) / 100)
  } else if (roomDiscountType === "amount") {
    discountedRoomSupplement -= parseFloat(roomDiscountValue || "0") || 0
  }
  discountedRoomSupplement = Math.max(0, discountedRoomSupplement)

  const customProductsTotal = customProducts.reduce((acc, p) => {
    const priceVal = parseFloat(p.price || "0") || 0
    const qtyVal = parseInt(p.quantity || "1", 10) || 1
    let prodTotal = priceVal * qtyVal
    if (p.discountType === "percentage") {
      prodTotal -= prodTotal * ((parseFloat(p.discountValue || "0") || 0) / 100)
    } else if (p.discountType === "amount") {
      prodTotal -= parseFloat(p.discountValue || "0") || 0
    }
    return acc + Math.max(0, prodTotal)
  }, 0)

  const packageUnitPriceHT = baseUnitPriceHT + discountedRoomSupplement + breakfastSupplement + discountedVisaKsaVal
  const totalHTBeforeGlobalDiscount = (quantityValue * packageUnitPriceHT) + customProductsTotal

  let globalDiscountAmount = 0
  if (discountType === "percentage") {
    globalDiscountAmount = totalHTBeforeGlobalDiscount * ((parseFloat(discountValue || "0") || 0) / 100)
  } else if (discountType === "amount") {
    globalDiscountAmount = parseFloat(discountValue || "0") || 0
  }
  const totalHT = Math.max(0, totalHTBeforeGlobalDiscount - globalDiscountAmount)

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
          quantity: quantityValue,
          amountHT: totalHT / quantityValue,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          discountName: discountName || null,
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
      <AppHeader
        links={[
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h2 className="mb-6 text-2xl font-bold">Nouvelle facture</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

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
                    setInvoiceNumber("")
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
                        <>
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
                          <div className="mt-2 border-t pt-2 space-y-1">
                            <label className="block text-[10px] text-gray-500 font-medium">Remise Visa</label>
                            <div className="flex gap-1">
                              <select
                                value={visaKsaDiscountType}
                                onChange={(e) => setVisaKsaDiscountType(e.target.value)}
                                className="text-[10px] px-1 py-1 border rounded-md"
                              >
                                <option value="none">Sans</option>
                                <option value="percentage">%</option>
                                <option value="amount">Montant</option>
                              </select>
                              {visaKsaDiscountType !== "none" && (
                                <>
                                  <input
                                    type="number"
                                    placeholder="Val"
                                    value={visaKsaDiscountValue}
                                    onChange={(e) => setVisaKsaDiscountValue(e.target.value)}
                                    className="w-12 text-[10px] px-1 py-1 border rounded-md"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Désignation"
                                    value={visaKsaDiscountName}
                                    onChange={(e) => setVisaKsaDiscountName(e.target.value)}
                                    className="flex-1 text-[10px] px-1 py-1 border rounded-md"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 rounded-md border border-gray-200 px-3 py-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type de chambre</label>
                        <select
                          value={roomType}
                          onChange={(e) => setRoomType(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          {roomTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label} (+{type.supplement.toFixed(2)} €)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-1 border-t pt-1 space-y-1">
                        <label className="block text-[10px] text-gray-500 font-medium">Remise chambre</label>
                        <div className="flex gap-1">
                          <select
                            value={roomDiscountType}
                            onChange={(e) => setRoomDiscountType(e.target.value)}
                            className="text-[10px] px-1 py-1 border rounded-md"
                          >
                            <option value="none">Sans</option>
                            <option value="percentage">%</option>
                            <option value="amount">Montant</option>
                          </select>
                          {roomDiscountType !== "none" && (
                            <>
                              <input
                                type="number"
                                placeholder="Val"
                                value={roomDiscountValue}
                                onChange={(e) => setRoomDiscountValue(e.target.value)}
                                className="w-12 text-[10px] px-1 py-1 border rounded-md"
                              />
                              <input
                                type="text"
                                placeholder="Désignation"
                                value={roomDiscountName}
                                onChange={(e) => setRoomDiscountName(e.target.value)}
                                className="flex-1 text-[10px] px-1 py-1 border rounded-md"
                              />
                            </>
                          )}
                        </div>
                      </div>
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
                        <div className="w-full sm:w-48">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Remise produit</label>
                          <div className="flex gap-1">
                            <select
                              value={product.discountType || "none"}
                              onChange={(e) => {
                                const newProducts = [...customProducts]
                                newProducts[index].discountType = e.target.value
                                setCustomProducts(newProducts)
                              }}
                              className="text-xs px-2 py-2 border rounded-md"
                            >
                              <option value="none">Sans</option>
                              <option value="percentage">%</option>
                              <option value="amount">Montant</option>
                            </select>
                            {product.discountType && product.discountType !== "none" && (
                              <>
                                <input
                                  type="number"
                                  placeholder="Val"
                                  value={product.discountValue || ""}
                                  onChange={(e) => {
                                    const newProducts = [...customProducts]
                                    newProducts[index].discountValue = e.target.value
                                    setCustomProducts(newProducts)
                                  }}
                                  className="w-12 text-xs px-1 py-2 border rounded-md"
                                />
                                <input
                                  type="text"
                                  placeholder="Nom"
                                  value={product.discountName || ""}
                                  onChange={(e) => {
                                    const newProducts = [...customProducts]
                                    newProducts[index].discountName = e.target.value
                                    setCustomProducts(newProducts)
                                  }}
                                  className="w-16 text-xs px-1 py-2 border rounded-md"
                                />
                              </>
                            )}
                          </div>
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

                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2 text-sm text-slate-800">Remise globale sur la facture</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Type de remise</label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="none">Aucune</option>
                        <option value="percentage">Pourcentage %</option>
                        <option value="amount">Montant fixe €</option>
                      </select>
                    </div>
                    {discountType !== "none" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1">Valeur de la remise</label>
                          <input
                            type="number"
                            step="0.01"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Dénomination de la remise</label>
                          <input
                            type="text"
                            value={discountName}
                            onChange={(e) => setDiscountName(e.target.value)}
                            placeholder="Ex: Geste commercial"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {amountHT && (
                  <div className="mt-4 rounded-md bg-gray-50 p-4 space-y-1.5">
                    <div className="flex justify-between gap-4 text-sm text-slate-600">
                      <span>Quantité</span>
                      <span>{quantityValue}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm text-slate-600">
                      <span>Prix unitaire HT hors chambre</span>
                      <span>{baseUnitPriceHT.toFixed(2)} €</span>
                    </div>
                    
                    {roomSupplement > 0 && (
                      <div className="flex justify-between gap-4 text-sm text-slate-600">
                        <span>Supplément chambre ({roomType})</span>
                        {discountedRoomSupplement !== roomSupplement ? (
                          <span>
                            <span className="line-through text-xs text-gray-400 mr-1">+{roomSupplement.toFixed(2)} €</span>
                            +{discountedRoomSupplement.toFixed(2)} €
                          </span>
                        ) : (
                          <span>+{roomSupplement.toFixed(2)} €</span>
                        )}
                      </div>
                    )}
                    
                    {includeBreakfast && (
                      <div className="flex justify-between gap-4 text-sm text-slate-600">
                        <span>Petit déjeuner ({stayDays} jour{stayDays > 1 ? "s" : ""})</span>
                        <span>+{breakfastSupplement.toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {includeVisaKsaExtra && (
                      <div className="flex justify-between gap-4 text-sm text-slate-600">
                        <span>Supplément visa KSA</span>
                        {discountedVisaKsaVal !== visaKsaVal ? (
                          <span>
                            <span className="line-through text-xs text-gray-400 mr-1">+{visaKsaVal.toFixed(2)} €</span>
                            +{discountedVisaKsaVal.toFixed(2)} €
                          </span>
                        ) : (
                          <span>+{visaKsaVal.toFixed(2)} €</span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between gap-4 text-sm border-t pt-1 mt-1 font-medium text-slate-700">
                      <span>Prix unitaire HT total</span>
                      <span>{packageUnitPriceHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm text-slate-600">
                      <span>Total package HT</span>
                      <span>{(quantityValue * packageUnitPriceHT).toFixed(2)} €</span>
                    </div>
                    
                    {customProducts.length > 0 && (
                      <div className="flex justify-between gap-4 text-sm text-slate-600">
                        <span>Total produits additionnels HT</span>
                        <span>{customProductsTotal.toFixed(2)} €</span>
                      </div>
                    )}
                    
                    {discountType !== "none" && (
                      <div className="flex justify-between gap-4 text-sm border-t pt-1 text-slate-500">
                        <span>Total brut HT</span>
                        <span>{totalHTBeforeGlobalDiscount.toFixed(2)} €</span>
                      </div>
                    )}

                    {discountType !== "none" && globalDiscountAmount > 0 && (
                      <div className="flex justify-between gap-4 text-sm text-red-600 font-medium">
                        <span>
                          {discountName ? `Remise globale : ${discountName}` : "Remise globale"} 
                          {discountType === "percentage" ? ` (-${discountValue}%)` : ""}
                        </span>
                        <span>-{globalDiscountAmount.toFixed(2)} €</span>
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-between gap-4 border-t pt-2 font-bold text-lg text-slate-900">
                      <span>Montant total à payer</span>
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
              href="/dashboard"
              className="flex-1 rounded-md border px-4 py-2.5 text-center font-medium hover:bg-gray-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedEntity || !selectedClient}
              className="flex-1 rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Création..." : "Créer la facture"}
            </button>
          </div>
        </form>
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

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}

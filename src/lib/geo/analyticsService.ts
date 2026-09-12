import { prisma } from "@/lib/db"
import { deduceRegionFromPostalCode } from "./geocoder"

export interface GeoFilterOptions {
  period?: string // 30d, 3m, 6m, this_year, last_year, all, custom
  startDate?: string
  endDate?: string
  entityId?: string
  country?: string
  region?: string
  city?: string
  postalCode?: string
  departureAirport?: string
  formulaType?: string
  invoiceStatus?: string
  clientType?: string // all, new, recurring
}

export function parseAirport(description: string = ""): string {
  const airportMatch = description.match(/Aéroport de départ:\s*([^\r\n]+)/)
  if (airportMatch) {
    return airportMatch[1].trim()
  }
  return "Non renseigné"
}

export function parseFormula(description: string = ""): string {
  const roomMatch = description.match(/Hébergement:\s*chambre\s*([^\r\n]+)/)
  if (roomMatch) {
    return roomMatch[1].trim()
  }
  return "Standard"
}

export async function getGeoAnalytics(filters: GeoFilterOptions = {}) {
  const now = new Date()
  let dateFrom: Date | undefined
  let dateTo: Date | undefined

  if (filters.period === "30d") {
    dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (filters.period === "3m") {
    dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  } else if (filters.period === "6m") {
    dateFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  } else if (filters.period === "this_year") {
    dateFrom = new Date(now.getFullYear(), 0, 1)
  } else if (filters.period === "last_year") {
    dateFrom = new Date(now.getFullYear() - 1, 0, 1)
    dateTo = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
  } else if (filters.period === "custom" && filters.startDate) {
    dateFrom = new Date(filters.startDate)
    if (filters.endDate) {
      dateTo = new Date(filters.endDate + "T23:59:59")
    }
  }

  // Période précédente pour comparaison (évolution %)
  let prevDateFrom: Date | undefined
  let prevDateTo: Date | undefined
  if (dateFrom) {
    const duration = (dateTo ? dateTo.getTime() : now.getTime()) - dateFrom.getTime()
    prevDateTo = new Date(dateFrom.getTime() - 1)
    prevDateFrom = new Date(dateFrom.getTime() - duration)
  }

  // 1. Récupération des factures avec leurs clients
  const allInvoices = await prisma.invoice.findMany({
    include: {
      client: true,
      entity: true,
    },
    orderBy: { date: "asc" },
  })

  // Identifier les clients récurrents (ayant plus d'une facture globale)
  const clientInvoiceCounts = new Map<string, number>()
  allInvoices.forEach((inv) => {
    clientInvoiceCounts.set(inv.clientId, (clientInvoiceCounts.get(inv.clientId) || 0) + 1)
  })

  // Filtrer les factures courantes
  const invoices = allInvoices.filter((inv) => {
    if (filters.entityId && filters.entityId !== "all" && inv.entityId !== filters.entityId) return false
    if (filters.invoiceStatus && filters.invoiceStatus !== "all" && inv.status !== filters.invoiceStatus) return false

    const invDate = new Date(inv.date)
    if (dateFrom && invDate < dateFrom) return false
    if (dateTo && invDate > dateTo) return false

    const client = inv.client
    if (filters.country && filters.country !== "all" && client.country !== filters.country) return false
    if (filters.region && filters.region !== "all" && client.region !== filters.region) return false
    if (filters.city && filters.city !== "all" && client.city?.toLowerCase() !== filters.city.toLowerCase()) return false
    if (filters.postalCode && client.postalCode !== filters.postalCode) return false

    const airport = parseAirport(inv.description)
    if (filters.departureAirport && filters.departureAirport !== "all" && airport.toLowerCase() !== filters.departureAirport.toLowerCase()) return false

    const formula = parseFormula(inv.description)
    if (filters.formulaType && filters.formulaType !== "all" && formula.toLowerCase() !== filters.formulaType.toLowerCase()) return false

    const isRecurring = (clientInvoiceCounts.get(inv.clientId) || 0) > 1
    if (filters.clientType === "new" && isRecurring) return false
    if (filters.clientType === "recurring" && !isRecurring) return false

    return true
  })

  // Factures période précédente pour calculer les évolutions
  const prevInvoices = prevDateFrom
    ? allInvoices.filter((inv) => {
        if (filters.entityId && filters.entityId !== "all" && inv.entityId !== filters.entityId) return false
        const invDate = new Date(inv.date)
        return invDate >= prevDateFrom! && (!prevDateTo || invDate <= prevDateTo)
      })
    : []

  // Calculs KPI principaux
  const totalInvoices = invoices.length
  const totalPilgrims = invoices.reduce((sum, inv) => sum + (inv.quantity || 1), 0)
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0)
  const averageBasket = totalInvoices > 0 ? totalRevenue / totalInvoices : 0
  const averagePerPilgrim = totalPilgrims > 0 ? totalRevenue / totalPilgrims : 0

  const prevTotalPilgrims = prevInvoices.reduce((sum, inv) => sum + (inv.quantity || 1), 0)
  const prevTotalRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0)
  const pilgrimEvolution = prevTotalPilgrims > 0 ? ((totalPilgrims - prevTotalPilgrims) / prevTotalPilgrims) * 100 : 0
  const revenueEvolution = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0

  // Qualité des données (sur l'ensemble des clients)
  const allClients = await prisma.client.findMany({
    include: { invoices: { select: { id: true } } },
  })
  const totalClientsCount = allClients.length
  let completeAddressCount = 0
  let geocodedCount = 0
  let geocodeFailedCount = 0
  let missingCityCount = 0
  let missingPostalCodeCount = 0
  const clientsToFix: Array<{
    id: string
    name: string
    city: string
    postalCode: string
    address: string
    error: string
    invoicesCount: number
  }> = []

  allClients.forEach((c) => {
    const hasAddress = Boolean(c.address && c.city && c.postalCode)
    if (hasAddress) completeAddressCount++
    if (c.latitude && c.longitude) geocodedCount++
    if (c.geocodeStatus === "FAILED") {
      geocodeFailedCount++
      clientsToFix.push({
        id: c.id,
        name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.company || "Sans nom",
        city: c.city || "Non renseignée",
        postalCode: c.postalCode || "Non renseigné",
        address: c.address || "Non renseignée",
        error: c.geocodeError || "Coordonnées GPS introuvables",
        invoicesCount: c.invoices.length,
      })
    }
    if (!c.city) missingCityCount++
    if (!c.postalCode) missingPostalCodeCount++
  })

  // Aggrégation par Régions
  const regionMap = new Map<string, {
    region: string
    pilgrims: number
    invoices: number
    revenue: number
    prevPilgrims: number
    airports: Record<string, number>
    cities: Set<string>
  }>()

  // Aggrégation par Villes
  const cityMap = new Map<string, {
    city: string
    region: string
    department?: string
    postalCode?: string
    latitude?: number
    longitude?: number
    pilgrims: number
    invoices: number
    revenue: number
    prevPilgrims: number
    airports: Record<string, number>
    formulas: Record<string, number>
    newClientsCount: number
    recurringClientsCount: number
    clientIds: Set<string>
  }>()

  // Aggrégation par Pays
  const countryMap = new Map<string, {
    country: string
    pilgrims: number
    invoices: number
    revenue: number
    prevPilgrims: number
  }>()

  // Distribution aéroports globale & croisement Résidence <-> Aéroport
  const airportDistribution: Record<string, number> = {}
  const airportByRegionMatrix: Record<string, Record<string, number>> = {}

  invoices.forEach((inv) => {
    const client = inv.client
    const region = client.region || "Région indéterminée"
    const city = client.city || "Ville indéterminée"
    const country = client.country || "France"
    const pilgrims = inv.quantity || 1
    const revenue = inv.totalTTC || 0
    const airport = parseAirport(inv.description)
    const formula = parseFormula(inv.description)
    const isRecurring = (clientInvoiceCounts.get(client.id) || 0) > 1

    // Aéroports
    airportDistribution[airport] = (airportDistribution[airport] || 0) + pilgrims
    if (!airportByRegionMatrix[region]) airportByRegionMatrix[region] = {}
    airportByRegionMatrix[region][airport] = (airportByRegionMatrix[region][airport] || 0) + pilgrims

    // Region map
    if (!regionMap.has(region)) {
      regionMap.set(region, {
        region,
        pilgrims: 0,
        invoices: 0,
        revenue: 0,
        prevPilgrims: 0,
        airports: {},
        cities: new Set(),
      })
    }
    const regItem = regionMap.get(region)!
    regItem.pilgrims += pilgrims
    regItem.invoices += 1
    regItem.revenue += revenue
    regItem.airports[airport] = (regItem.airports[airport] || 0) + pilgrims
    if (client.city) regItem.cities.add(client.city)

    // City map (clé = city.toLowerCase())
    const cityKey = city.toLowerCase()
    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, {
        city,
        region,
        department: client.department || undefined,
        postalCode: client.postalCode || undefined,
        latitude: client.latitude || undefined,
        longitude: client.longitude || undefined,
        pilgrims: 0,
        invoices: 0,
        revenue: 0,
        prevPilgrims: 0,
        airports: {},
        formulas: {},
        newClientsCount: 0,
        recurringClientsCount: 0,
        clientIds: new Set(),
      })
    }
    const cItem = cityMap.get(cityKey)!
    cItem.pilgrims += pilgrims
    cItem.invoices += 1
    cItem.revenue += revenue
    cItem.airports[airport] = (cItem.airports[airport] || 0) + pilgrims
    cItem.formulas[formula] = (cItem.formulas[formula] || 0) + pilgrims
    if (isRecurring) cItem.recurringClientsCount++
    else cItem.newClientsCount++
    cItem.clientIds.add(client.id)
    if (!cItem.latitude && client.latitude) {
      cItem.latitude = client.latitude
      cItem.longitude = client.longitude || undefined
    }

    // Country map
    if (!countryMap.has(country)) {
      countryMap.set(country, {
        country,
        pilgrims: 0,
        invoices: 0,
        revenue: 0,
        prevPilgrims: 0,
      })
    }
    const ctryItem = countryMap.get(country)!
    ctryItem.pilgrims += pilgrims
    ctryItem.invoices += 1
    ctryItem.revenue += revenue
  })

  // Intégrer les volumes précédents pour calculer l'évolution %
  prevInvoices.forEach((inv) => {
    const reg = inv.client.region || "Région indéterminée"
    const city = (inv.client.city || "Ville indéterminée").toLowerCase()
    const ctry = inv.client.country || "France"
    const pilgrims = inv.quantity || 1

    if (regionMap.has(reg)) {
      regionMap.get(reg)!.prevPilgrims += pilgrims
    }
    if (cityMap.has(city)) {
      cityMap.get(city)!.prevPilgrims += pilgrims
    }
    if (countryMap.has(ctry)) {
      countryMap.get(ctry)!.prevPilgrims += pilgrims
    }
  })

  // Formatage des tableaux triables
  const regionsRanked = Array.from(regionMap.values())
    .map((r) => {
      const evolution = r.prevPilgrims > 0 ? ((r.pilgrims - r.prevPilgrims) / r.prevPilgrims) * 100 : (r.pilgrims > 0 ? 100 : 0)
      const topAirport = Object.entries(r.airports).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
      return {
        name: r.region,
        pilgrims: r.pilgrims,
        invoices: r.invoices,
        revenue: r.revenue,
        averageBasket: r.invoices > 0 ? r.revenue / r.invoices : 0,
        evolution: Math.round(evolution * 10) / 10,
        topAirport,
        citiesCount: r.cities.size,
      }
    })
    .sort((a, b) => b.pilgrims - a.pilgrims)

  const citiesRanked = Array.from(cityMap.values())
    .map((c) => {
      const evolution = c.prevPilgrims > 0 ? ((c.pilgrims - c.prevPilgrims) / c.prevPilgrims) * 100 : (c.pilgrims > 0 ? 100 : 0)
      const topAirport = Object.entries(c.airports).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
      const topFormula = Object.entries(c.formulas).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
      return {
        name: c.city,
        region: c.region,
        department: c.department,
        postalCode: c.postalCode,
        latitude: c.latitude,
        longitude: c.longitude,
        pilgrims: c.pilgrims,
        invoices: c.invoices,
        revenue: c.revenue,
        averageBasket: c.invoices > 0 ? c.revenue / c.invoices : 0,
        averagePerPilgrim: c.pilgrims > 0 ? c.revenue / c.pilgrims : 0,
        evolution: Math.round(evolution * 10) / 10,
        topAirport,
        topFormula,
        airportsBreakdown: c.airports,
        formulasBreakdown: c.formulas,
        newClients: c.newClientsCount,
        recurringClients: c.recurringClientsCount,
        clientsCount: c.clientIds.size,
      }
    })
    .sort((a, b) => b.pilgrims - a.pilgrims)

  const countriesRanked = Array.from(countryMap.values())
    .map((c) => {
      const evolution = c.prevPilgrims > 0 ? ((c.pilgrims - c.prevPilgrims) / c.prevPilgrims) * 100 : (c.pilgrims > 0 ? 100 : 0)
      return {
        name: c.country,
        pilgrims: c.pilgrims,
        invoices: c.invoices,
        revenue: c.revenue,
        averageBasket: c.invoices > 0 ? c.revenue / c.invoices : 0,
        evolution: Math.round(evolution * 10) / 10,
      }
    })
    .sort((a, b) => b.pilgrims - a.pilgrims)

  // KPI additionnels
  const activeCitiesCount = citiesRanked.filter((c) => c.pilgrims > 0).length
  const topRegion = regionsRanked[0]?.name || "N/A"
  const highestGrowthRegion = [...regionsRanked].sort((a, b) => b.evolution - a.evolution)[0]?.name || "N/A"

  // Évolution mensuelle sur les factures sélectionnées
  const monthlyMap: Record<string, { label: string; pilgrims: number; revenue: number; invoices: number }> = {}
  invoices.forEach((inv) => {
    const d = new Date(inv.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
    if (!monthlyMap[key]) {
      monthlyMap[key] = { label, pilgrims: 0, revenue: 0, invoices: 0 }
    }
    monthlyMap[key].pilgrims += inv.quantity || 1
    monthlyMap[key].revenue += inv.totalTTC || 0
    monthlyMap[key].invoices += 1
  })
  const monthlyTrend = Object.keys(monthlyMap)
    .sort()
    .map((k) => ({
      key: k,
      ...monthlyMap[k],
    }))

  // Nouveaux vs Récurrents
  let totalNewClients = 0
  let totalRecurringClients = 0
  invoices.forEach((inv) => {
    const isRecurring = (clientInvoiceCounts.get(inv.clientId) || 0) > 1
    if (isRecurring) totalRecurringClients++
    else totalNewClients++
  })

  // Opportunités géographiques statistiques (Section 12)
  const opportunities = regionsRanked.map((reg) => {
    let category: "strong" | "emerging" | "declining" | "watch" = "watch"
    let explanation = ""

    if (reg.pilgrims >= 10 && reg.revenue >= 15000) {
      category = "strong"
      explanation = "Bassin historique majeur avec fort volume et chiffre d'affaires élevé."
    } else if (reg.evolution >= 25 && reg.pilgrims >= 3) {
      category = "emerging"
      explanation = "Dynamique en forte progression (+ " + reg.evolution + "%), intérêt croissant à consolider."
    } else if (reg.evolution < -15 && reg.pilgrims >= 3) {
      category = "declining"
      explanation = "Ralentissement notable par rapport à la période précédente (- " + Math.abs(reg.evolution) + "%)."
    } else {
      category = "watch"
      explanation = "Volume ponctuel ou faible présence nécessitant un suivi régulier."
    }

    return {
      region: reg.name,
      category,
      explanation,
      pilgrims: reg.pilgrims,
      revenue: reg.revenue,
      evolution: reg.evolution,
      topAirport: reg.topAirport,
    }
  })

  // Points cartographiques agrégés pour Leaflet
  const mapPoints = citiesRanked
    .filter((c) => c.latitude && c.longitude)
    .map((c) => ({
      city: c.name,
      region: c.region,
      latitude: c.latitude!,
      longitude: c.longitude!,
      pilgrims: c.pilgrims,
      invoices: c.invoices,
      revenue: c.revenue,
      averageBasket: c.averageBasket,
      topAirport: c.topAirport,
    }))

  return {
    kpis: {
      totalPilgrims,
      totalInvoices,
      totalRevenue,
      averageBasket,
      averagePerPilgrim,
      activeCitiesCount,
      topRegion,
      highestGrowthRegion,
      pilgrimEvolution: Math.round(pilgrimEvolution * 10) / 10,
      revenueEvolution: Math.round(revenueEvolution * 10) / 10,
    },
    quality: {
      totalClientsCount,
      completeAddressCount,
      geocodedCount,
      geocodedPercentage: totalClientsCount > 0 ? Math.round((geocodedCount / totalClientsCount) * 1000) / 10 : 0,
      geocodeFailedCount,
      missingCityCount,
      missingPostalCodeCount,
      clientsToFix,
    },
    rankings: {
      regions: regionsRanked,
      cities: citiesRanked,
      countries: countriesRanked,
    },
    charts: {
      regionsByPilgrims: regionsRanked.slice(0, 8),
      regionsByRevenue: [...regionsRanked].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      monthlyTrend,
      airportDistribution,
      airportByRegionMatrix,
      clientTypes: {
        new: totalNewClients,
        recurring: totalRecurringClients,
      },
    },
    opportunities,
    mapPoints,
  }
}


"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { GeoFilters, GeoFilterState } from "./GeoFilters"
import { ZoneDetailDrawer, ZoneDetailData } from "./ZoneDetailDrawer"
import { GeoCharts } from "./GeoCharts"

// Chargement dynamique de la carte Leaflet côté client pour éviter toute erreur SSR
const GeoMap = dynamic(() => import("./GeoMap").then((mod) => mod.GeoMap), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-semibold animate-pulse border border-slate-200">
      Chargement de la carte interactive...
    </div>
  ),
})

interface GeoDashboardProps {
  entities: Array<{ id: string; commercialName: string }>
}

export function GeoDashboard({ entities }: GeoDashboardProps) {
  const [filters, setFilters] = useState<GeoFilterState>({
    period: "all",
  })
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Onglet sélectionné pour le tableau des zones (Villes / Régions / Pays)
  const [rankingTab, setRankingTab] = useState<"cities" | "regions" | "countries">("regions")
  const [sortBy, setSortBy] = useState<string>("pilgrims")
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  // Tiroir zone sélectionnée
  const [selectedZone, setSelectedZone] = useState<ZoneDetailData | null>(null)

  // Géocodage en cours
  const [geocodingInProgress, setGeocodingInProgress] = useState(false)
  const [geocodeFeedback, setGeocodeFeedback] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.period) params.set("period", filters.period)
      if (filters.startDate) params.set("startDate", filters.startDate)
      if (filters.endDate) params.set("endDate", filters.endDate)
      if (filters.entityId && filters.entityId !== "all") params.set("entityId", filters.entityId)
      if (filters.departureAirport && filters.departureAirport !== "all") params.set("departureAirport", filters.departureAirport)
      if (filters.formulaType && filters.formulaType !== "all") params.set("formulaType", filters.formulaType)
      if (filters.invoiceStatus && filters.invoiceStatus !== "all") params.set("invoiceStatus", filters.invoiceStatus)
      if (filters.clientType && filters.clientType !== "all") params.set("clientType", filters.clientType)

      const res = await fetch(`/api/analytics/geo?${params.toString()}`)
      if (!res.ok) throw new Error("Erreur de chargement des données analytiques")
      const json = await res.json()
      setData(json)
    } catch {
      setError("Impossible de charger les statistiques géographiques.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (newValues: Partial<GeoFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newValues }))
  }

  // Clic sur un point ou une ville sur la carte
  const handleSelectCity = (cityName: string) => {
    if (!data?.rankings?.cities) return
    const found = data.rankings.cities.find((c: any) => c.name.toLowerCase() === cityName.toLowerCase())
    if (found) {
      setSelectedZone(found)
    }
  }

  // Lancer le géocodage par lot des clients restants
  const handleTriggerGeocoding = async () => {
    setGeocodingInProgress(true)
    setGeocodeFeedback(null)
    try {
      const res = await fetch("/api/analytics/geo/batch-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 30 }),
      })
      if (res.ok) {
        const resJson = await res.json()
        setGeocodeFeedback(
          `${resJson.updatedCount} adresse(s) géolocalisée(s) avec succès (${resJson.failedCount} non résolue(s)).`
        )
        // Recharger les données
        fetchData()
      } else {
        setGeocodeFeedback("Erreur lors de la synchronisation.")
      }
    } catch {
      setGeocodeFeedback("Erreur de communication avec le service de géocodage.")
    } finally {
      setGeocodingInProgress(false)
    }
  }

  const kpis = data?.kpis
  const quality = data?.quality

  // Tri du tableau des zones
  let rankedList: any[] = []
  if (data?.rankings) {
    if (rankingTab === "regions") rankedList = [...data.rankings.regions]
    else if (rankingTab === "cities") rankedList = [...data.rankings.cities]
    else rankedList = [...data.rankings.countries]

    rankedList.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = (bVal || "").toLowerCase()
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortAsc ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
    })
  }

  return (
    <div className="space-y-8">
      {/* 1. Barre de filtres unifiée */}
      <GeoFilters filters={filters} onChange={handleFilterChange} entities={entities} />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* 2. Cartes KPI réactives en haut de page */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-7">
        {/* Pèlerins */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pèlerins</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{kpis?.totalPilgrims ?? "-"}</span>
            <span className="text-[11px] font-medium text-slate-400">pers.</span>
          </div>
          <div className="mt-2 text-[10px] font-bold">
            {kpis?.pilgrimEvolution !== undefined && (
              <span className={kpis.pilgrimEvolution >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {kpis.pilgrimEvolution >= 0 ? "▲ +" : "▼ "}{kpis.pilgrimEvolution}% vs N-1
              </span>
            )}
          </div>
        </div>

        {/* Réservations / Dossiers */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dossiers</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">{kpis?.totalInvoices ?? "-"}</span>
            <span className="text-[11px] font-medium text-slate-400">factures</span>
          </div>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Activité période</p>
        </div>

        {/* Chiffre d'affaires */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">CA Total</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 truncate">
              {kpis ? Math.round(kpis.totalRevenue).toLocaleString("fr-FR") : "-"} €
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold">
            {kpis?.revenueEvolution !== undefined && (
              <span className={kpis.revenueEvolution >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {kpis.revenueEvolution >= 0 ? "▲ +" : "▼ "}{kpis.revenueEvolution}% vs N-1
              </span>
            )}
          </div>
        </div>

        {/* Panier moyen */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Panier Moyen</p>
          <span className="text-xl font-black text-slate-900 truncate">
            {kpis ? Math.round(kpis.averageBasket).toLocaleString("fr-FR") : "-"} €
          </span>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Par dossier</p>
        </div>

        {/* Villes actives */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Villes Actives</p>
          <span className="text-2xl font-black text-blue-600">{kpis?.activeCitiesCount ?? "-"}</span>
          <p className="mt-2 text-[10px] font-medium text-slate-400">Avec &ge; 1 réservation</p>
        </div>

        {/* Région N°1 */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Région N°1</p>
          <span className="text-sm font-black text-slate-900 truncate block">
            {kpis?.topRegion ?? "-"}
          </span>
          <p className="mt-2 text-[10px] font-medium text-emerald-600 font-semibold">Leader volume</p>
        </div>

        {/* Plus forte progression */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium transition-premium hover:shadow-card-hover">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Top Progression</p>
          <span className="text-sm font-black text-slate-900 truncate block">
            {kpis?.highestGrowthRegion ?? "-"}
          </span>
          <p className="mt-2 text-[10px] font-semibold text-blue-600">Dynamique forte</p>
        </div>
      </div>

      {/* 3. Carte interactive (Europe / France / Régions / Villes) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Carte de répartition géographique</h2>
            <p className="text-xs text-slate-400">
              Visualisation analytique par densité de pèlerins. Cliquez sur une agglomération pour ouvrir le tiroir d&apos;analyse.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {data?.mapPoints?.length || 0} zone(s) cartographiée(s)
          </span>
        </div>

        <GeoMap
          points={data?.mapPoints || []}
          regions={data?.rankings?.regions || []}
          onSelectZone={handleSelectCity}
          selectedCity={selectedZone?.name}
        />
      </div>

      {/* 4. Tableau Classement Géographique (Top zones) */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/30">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top zones géographiques</h3>
            <p className="text-xs text-slate-400">Consultez et classez la performance par territoire</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRankingTab("regions")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-premium cursor-pointer ${
                rankingTab === "regions" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Régions
            </button>
            <button
              type="button"
              onClick={() => setRankingTab("cities")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-premium cursor-pointer ${
                rankingTab === "cities" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Villes
            </button>
            <button
              type="button"
              onClick={() => setRankingTab("countries")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-premium cursor-pointer ${
                rankingTab === "countries" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pays
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3 pl-4">Rang</th>
                <th
                  className="p-3 cursor-pointer select-none hover:text-slate-700"
                  onClick={() => {
                    setSortBy("name")
                    setSortAsc(sortBy === "name" ? !sortAsc : true)
                  }}
                >
                  {rankingTab === "regions" ? "Région" : rankingTab === "cities" ? "Ville / Région" : "Pays"}
                  {sortBy === "name" && (sortAsc ? " ▲" : " ▼")}
                </th>
                <th
                  className="p-3 text-right cursor-pointer select-none hover:text-slate-700"
                  onClick={() => {
                    setSortBy("pilgrims")
                    setSortAsc(sortBy === "pilgrims" ? !sortAsc : false)
                  }}
                >
                  Pèlerins {sortBy === "pilgrims" && (sortAsc ? " ▲" : " ▼")}
                </th>
                <th
                  className="p-3 text-right cursor-pointer select-none hover:text-slate-700"
                  onClick={() => {
                    setSortBy("invoices")
                    setSortAsc(sortBy === "invoices" ? !sortAsc : false)
                  }}
                >
                  Dossiers {sortBy === "invoices" && (sortAsc ? " ▲" : " ▼")}
                </th>
                <th
                  className="p-3 text-right cursor-pointer select-none hover:text-slate-700"
                  onClick={() => {
                    setSortBy("revenue")
                    setSortAsc(sortBy === "revenue" ? !sortAsc : false)
                  }}
                >
                  Chiffre d&apos;Affaires {sortBy === "revenue" && (sortAsc ? " ▲" : " ▼")}
                </th>
                <th className="p-3 text-right">Panier Moyen</th>
                <th className="p-3 text-center">Évolution %</th>
                {rankingTab !== "countries" && <th className="p-3">Aéroport N°1</th>}
                <th className="p-3 pr-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {rankedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Aucune zone trouvée pour les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                rankedList.map((item, idx) => (
                  <tr key={item.name} className="hover:bg-slate-50/50 transition-premium">
                    <td className="p-3 pl-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      {item.region && rankingTab === "cities" && (
                        <div className="text-[10px] text-slate-400 font-normal">{item.region}</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">{item.pilgrims}</td>
                    <td className="p-3 text-right text-slate-600">{item.invoices}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {Math.round(item.revenue).toLocaleString("fr-FR")} €
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      {Math.round(item.averageBasket).toLocaleString("fr-FR")} €
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.evolution > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : item.evolution < 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.evolution > 0 ? "+" : ""}{item.evolution}%
                      </span>
                    </td>
                    {rankingTab !== "countries" && (
                      <td className="p-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {item.topAirport || "N/A"}
                        </span>
                      </td>
                    )}
                    <td className="p-3 pr-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (rankingTab === "cities") setSelectedZone(item)
                          else {
                            // Basculer sur le filtre de région
                            handleFilterChange({ period: filters.period })
                          }
                        }}
                        className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-premium cursor-pointer"
                      >
                        {rankingTab === "cities" ? "Détails" : "Voir"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Graphiques analytiques décisionnels */}
      {data?.charts && <GeoCharts charts={data.charts} />}

      {/* 6. Section Opportunités Géographiques Commerciales (Section 12) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">Opportunités géographiques & Recommandations</h3>
          <p className="text-xs text-slate-400">
            Règles statistiques transparentes sans algorithme opaque pour guider vos campagnes et ouvertures de vols.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data?.opportunities?.map((op: any) => {
            const badgeStyles: Record<string, string> = {
              strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
              emerging: "bg-blue-50 text-blue-700 border-blue-200",
              declining: "bg-amber-50 text-amber-700 border-amber-200",
              watch: "bg-slate-50 text-slate-600 border-slate-200",
            }
            const labels: Record<string, string> = {
              strong: "Zone Forte",
              emerging: "Zone Émergente",
              declining: "Zone en Baisse",
              watch: "À Surveiller",
            }

            return (
              <div
                key={op.region}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{op.region}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyles[op.category]}`}>
                      {labels[op.category]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{op.explanation}</p>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 border-t border-slate-200/60 pt-2 flex justify-between">
                  <span>{op.pilgrims} pèlerins</span>
                  <span className="text-slate-400">Départ: {op.topAirport}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 7. Section Qualité des Données & Adresses à corriger (Section 15) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Qualité et fiabilité des données géographiques</h3>
            <p className="text-xs text-slate-400">
              Indicateurs de complétude des adresses clients et état du géocodage persistant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              {quality?.geocodedPercentage ?? 0}% des clients géolocalisés
            </span>
            <button
              type="button"
              onClick={handleTriggerGeocoding}
              disabled={geocodingInProgress}
              className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-premium transition-premium hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {geocodingInProgress ? "Synchronisation..." : "Géocoder les nouveaux clients"}
            </button>
          </div>
        </div>

        {geocodeFeedback && (
          <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700 border border-blue-100">
            {geocodeFeedback}
          </div>
        )}

        {/* Métriques qualité */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-6 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Clients</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{quality?.totalClientsCount ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Adresse complète</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{quality?.completeAddressCount ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Géolocalisés</p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{quality?.geocodedCount ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Sans code postal</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{quality?.missingPostalCodeCount ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-rose-600 uppercase">À corriger</p>
            <p className="text-lg font-black text-rose-600 mt-0.5">{quality?.geocodeFailedCount ?? 0}</p>
          </div>
        </div>

        {/* Tableau des adresses à corriger */}
        {quality?.clientsToFix && quality.clientsToFix.length > 0 && (
          <div className="border border-rose-100 rounded-xl overflow-hidden">
            <div className="bg-rose-50/50 p-3 border-b border-rose-100">
              <h4 className="text-xs font-bold text-rose-800">
                Adresses à corriger ({quality.clientsToFix.length})
              </h4>
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-2.5 pl-3">Client</th>
                    <th className="p-2.5">Adresse</th>
                    <th className="p-2.5">Code postal</th>
                    <th className="p-2.5">Ville</th>
                    <th className="p-2.5">Anomalie constatée</th>
                    <th className="p-2.5 pr-3 text-center">Fiche client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {quality.clientsToFix.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2.5 pl-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="p-2.5 text-slate-600">{c.address}</td>
                      <td className="p-2.5 text-slate-600">{c.postalCode}</td>
                      <td className="p-2.5 text-slate-600">{c.city}</td>
                      <td className="p-2.5 text-rose-600 font-semibold">{c.error}</td>
                      <td className="p-2.5 pr-3 text-center">
                        <Link
                          href={`/clients`}
                          className="text-blue-600 hover:underline font-bold text-[11px]"
                        >
                          Corriger ➔
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 8. Tiroir latéral de détail de zone */}
      <ZoneDetailDrawer zone={selectedZone} onClose={() => setSelectedZone(null)} />
    </div>
  )
}


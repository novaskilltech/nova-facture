"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export interface MapPoint {
  city: string
  region: string
  latitude: number
  longitude: number
  pilgrims: number
  invoices: number
  revenue: number
  averageBasket: number
  topAirport: string
}

export interface RegionStat {
  name: string
  pilgrims: number
  invoices: number
  revenue: number
  averageBasket: number
  evolution: number
  topAirport: string
}

interface GeoMapProps {
  points: MapPoint[]
  regions?: RegionStat[]
  onSelectZone: (name: string) => void
  selectedCity?: string | null
}

function normalizeRegionName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

function getRegionColor(pilgrims: number, maxPilgrims: number): string {
  if (pilgrims === 0) return "#f1f5f9"
  const ratio = pilgrims / maxPilgrims
  if (ratio > 0.6) return "#1e40af" // Bleu nuit
  if (ratio > 0.3) return "#2563eb" // Bleu royal
  if (ratio > 0.1) return "#38bdf8" // Bleu ciel
  return "#93c5fd" // Bleu pastel
}

export function GeoMap({ points, regions = [], onSelectZone, selectedCity }: GeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)

  const [mapMode, setMapMode] = useState<"regions" | "cities">("regions")
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null)

  // 1. Téléchargement des polygones GeoJSON des régions (embarqué en local sans clé)
  useEffect(() => {
    fetch("/regions-simplifiees.geojson")
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Erreur de chargement du GeoJSON des régions :", err))
  }, [])

  // 2. Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [46.603354, 1.888334],
        zoom: 6,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      const layerGroup = L.layerGroup().addTo(map)
      mapInstanceRef.current = map
      layerGroupRef.current = layerGroup
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // 3. Mise à jour de l'affichage (Mode Régions Choroplèthe VS Mode Villes Ponctuelles)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return

    layerGroupRef.current.clearLayers()
    if (geoJsonLayerRef.current) {
      mapInstanceRef.current.removeLayer(geoJsonLayerRef.current)
      geoJsonLayerRef.current = null
    }

    // --- MODE RÉGIONS (Polygones & Choroplèthe) ---
    if (mapMode === "regions" && geoJsonData) {
      const maxPilgrims = Math.max(...regions.map((r) => r.pilgrims), 1)

      const geoLayer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const rawName = feature?.properties?.nom || ""
          const normName = normalizeRegionName(rawName)
          const matched = regions.find((r) => normalizeRegionName(r.name) === normName)
          const pilgrims = matched?.pilgrims || 0

          const isSelected = selectedCity && normalizeRegionName(selectedCity) === normName

          return {
            fillColor: getRegionColor(pilgrims, maxPilgrims),
            weight: isSelected ? 3 : 1.5,
            opacity: 1,
            color: isSelected ? "#0f172a" : "#ffffff",
            fillOpacity: pilgrims > 0 ? 0.75 : 0.2,
          }
        },
        onEachFeature: (feature, layer) => {
          const rawName = feature.properties.nom
          const normName = normalizeRegionName(rawName)
          const matched = regions.find((r) => normalizeRegionName(r.name) === normName)
          const pilgrims = matched?.pilgrims || 0
          const revenue = matched?.revenue || 0
          const topAirport = matched?.topAirport || "Non renseigné"

          const popupContent = `
            <div class="p-1 font-sans text-xs">
              <div class="font-black text-sm text-slate-900 mb-1">${rawName}</div>
              <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-slate-700">
                <div><strong>${pilgrims}</strong> pèlerin(s)</div>
                <div><strong>${matched?.invoices || 0}</strong> dossier(s)</div>
                <div><strong>${revenue.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €</strong> CA</div>
                <div><strong>${topAirport}</strong> (Aéroport)</div>
              </div>
              <div class="mt-2 text-center text-blue-600 font-semibold cursor-pointer">
                ➔ Cliquer pour voir les statistiques régionales
              </div>
            </div>
          `
          layer.bindPopup(popupContent)

          layer.on({
            mouseover: (e) => {
              const target = e.target
              target.setStyle({ weight: 2.5, color: "#1e3a8a", fillOpacity: 0.85 })
            },
            mouseout: (e) => {
              geoLayer.resetStyle(e.target)
            },
            click: () => {
              onSelectZone(rawName)
            },
          })
        },
      })

      geoLayer.addTo(mapInstanceRef.current)
      geoJsonLayerRef.current = geoLayer
    }

    // --- MODE VILLES (Cercles proportionnels par agglomération) ---
    if (mapMode === "cities") {
      const maxPilgrims = Math.max(...points.map((p) => p.pilgrims), 1)

      points.forEach((pt) => {
        const ratio = pt.pilgrims / maxPilgrims
        const radius = Math.max(10, Math.min(42, Math.round(10 + ratio * 32)))
        const isSelected = selectedCity?.toLowerCase() === pt.city.toLowerCase()

        const circleMarker = L.circleMarker([pt.latitude, pt.longitude], {
          radius,
          fillColor: isSelected ? "#2563eb" : pt.pilgrims >= 10 ? "#0284c7" : "#0d9488",
          color: isSelected ? "#1d4ed8" : "#ffffff",
          weight: isSelected ? 3 : 2,
          opacity: 1,
          fillOpacity: isSelected ? 0.85 : 0.65,
        })

        const popupContent = `
          <div class="p-1 font-sans text-xs">
            <div class="font-bold text-sm text-slate-900 mb-1">${pt.city}</div>
            <div class="text-slate-500 text-[11px] mb-2">${pt.region}</div>
            <div class="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-slate-700">
              <div><strong>${pt.pilgrims}</strong> pèlerin(s)</div>
              <div><strong>${pt.invoices}</strong> dossier(s)</div>
              <div><strong>${pt.revenue.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €</strong> CA</div>
              <div><strong>${pt.topAirport}</strong> (Départ)</div>
            </div>
            <div class="mt-2 text-center text-blue-600 font-semibold cursor-pointer">
              ➔ Cliquer pour voir les détails
            </div>
          </div>
        `
        circleMarker.bindPopup(popupContent)
        circleMarker.on("click", () => onSelectZone(pt.city))
        circleMarker.addTo(layerGroupRef.current!)
      })
    }
  }, [points, regions, mapMode, geoJsonData, selectedCity, onSelectZone])

  return (
    <div className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-premium bg-slate-100">
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Sélecteur de vue Mode Régions / Villes */}
      <div className="absolute top-4 right-4 z-20 flex rounded-xl border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setMapMode("regions")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-premium cursor-pointer ${
            mapMode === "regions"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Vue Régions (Choroplèthe)
        </button>
        <button
          type="button"
          onClick={() => setMapMode("cities")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-premium cursor-pointer ${
            mapMode === "cities"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Vue Villes (Points)
        </button>
      </div>

      {/* Légende dynamique */}
      <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm border border-slate-200/80">
        <p className="font-bold text-slate-800 mb-1.5">
          {mapMode === "regions" ? "Intensité par région" : "Densité par ville"}
        </p>
        {mapMode === "regions" ? (
          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-xs bg-[#f1f5f9] border border-slate-300"></span>
              <span>0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-xs bg-[#93c5fd]"></span>
              <span>Faible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-xs bg-[#38bdf8]"></span>
              <span>Moyen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-xs bg-[#2563eb]"></span>
              <span>Fort</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-xs bg-[#1e40af]"></span>
              <span>Leader</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600"></span>
              <span>1 - 4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-sky-600"></span>
              <span>5 - 9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-4.5 w-4.5 rounded-full bg-blue-600"></span>
              <span>10+</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



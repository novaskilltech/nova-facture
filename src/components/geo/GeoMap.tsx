"use client"

import { useEffect, useRef } from "react"
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

interface GeoMapProps {
  points: MapPoint[]
  onSelectZone: (city: string) => void
  selectedCity?: string | null
}

export function GeoMap({ points, onSelectZone, selectedCity }: GeoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      // Centre sur la France / Europe de l'Ouest
      const map = L.map(mapContainerRef.current, {
        center: [46.603354, 1.888334],
        zoom: 6,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: true,
      })

      // Fond de carte clair et épuré OpenStreetMap / CartoDB Positron
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

  // Mise à jour des points / cercles proportionnels au volume de pèlerins
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return

    layerGroupRef.current.clearLayers()

    if (points.length === 0) return

    // Déterminer le max de pèlerins pour pondération visuelle
    const maxPilgrims = Math.max(...points.map((p) => p.pilgrims), 1)

    points.forEach((pt) => {
      // Rayon dynamique proportionnel au nombre de pèlerins
      const ratio = pt.pilgrims / maxPilgrims
      const radius = Math.max(10, Math.min(42, Math.round(10 + ratio * 32)))

      const isSelected = selectedCity?.toLowerCase() === pt.city.toLowerCase()

      const circleMarker = L.circleMarker([pt.latitude, pt.longitude], {
        radius,
        fillColor: isSelected ? "#2563eb" : (pt.pilgrims >= 10 ? "#0284c7" : "#0d9488"),
        color: isSelected ? "#1d4ed8" : "#ffffff",
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.85 : 0.65,
      })

      // Infobulle / Popup
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

      circleMarker.on("click", () => {
        onSelectZone(pt.city)
      })

      circleMarker.addTo(layerGroupRef.current!)
    })
  }, [points, selectedCity, onSelectZone])

  return (
    <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-premium bg-slate-100">
      <div ref={mapContainerRef} className="h-full w-full z-10" />

      {/* Légende flottante */}
      <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm border border-slate-200/80">
        <p className="font-bold text-slate-800 mb-1">Densité de pèlerins</p>
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
      </div>
    </div>
  )
}


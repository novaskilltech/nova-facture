"use client"

import Link from "next/link"

export interface ZoneDetailData {
  name: string
  region: string
  department?: string
  postalCode?: string
  pilgrims: number
  invoices: number
  revenue: number
  averageBasket: number
  averagePerPilgrim: number
  evolution: number
  topAirport: string
  topFormula: string
  airportsBreakdown: Record<string, number>
  formulasBreakdown: Record<string, number>
  newClients: number
  recurringClients: number
  clientsCount: number
}

interface ZoneDetailDrawerProps {
  zone: ZoneDetailData | null
  onClose: () => void
}

export function ZoneDetailDrawer({ zone, onClose }: ZoneDetailDrawerProps) {
  if (!zone) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {zone.region}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                {zone.name}
              </h3>
              {zone.postalCode && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Code postal : {zone.postalCode} {zone.department ? `(${zone.department})` : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-premium cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* KPI rapides de la zone */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pèlerins</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{zone.pilgrims}</p>
              <span className={`text-[10px] font-bold ${zone.evolution >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {zone.evolution >= 0 ? "+" : ""}{zone.evolution}% vs N-1
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chiffre d&apos;Affaires</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">
                {zone.revenue.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Panier : {Math.round(zone.averageBasket).toLocaleString("fr-FR")} €
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dossiers / Réservations</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{zone.invoices}</p>
              <span className="text-[10px] text-slate-400 font-medium">
                {zone.clientsCount} payeur(s) distinct(s)
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Moy. par Pèlerin</p>
              <p className="text-lg font-black text-blue-600 mt-0.5">
                {Math.round(zone.averagePerPilgrim).toLocaleString("fr-FR")} €
              </p>
              <span className="text-[10px] text-slate-400 font-medium">Revenu unitaire</span>
            </div>
          </div>

          {/* Ventilation Aéroports de départ */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Aéroports de départ choisis
            </h4>
            <div className="space-y-2">
              {Object.entries(zone.airportsBreakdown || {}).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun aéroport renseigné</p>
              ) : (
                Object.entries(zone.airportsBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([airport, count]) => {
                    const pct = zone.pilgrims > 0 ? Math.round((count / zone.pilgrims) * 100) : 0
                    return (
                      <div key={airport} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{airport}</span>
                          <span>{count} pèlerin(s) ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          {/* Formules et types de chambres */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Types de formules vendues
            </h4>
            <div className="space-y-2">
              {Object.entries(zone.formulasBreakdown || {}).length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune formule renseignée</p>
              ) : (
                Object.entries(zone.formulasBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([formula, count]) => {
                    const pct = zone.pilgrims > 0 ? Math.round((count / zone.pilgrims) * 100) : 0
                    return (
                      <div key={formula} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="capitalize">{formula}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          {/* Nouveaux vs Récurrents */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <p className="text-xs font-bold text-slate-700 mb-2">Profil des clients dans la zone</p>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span>Nouveaux clients : <strong>{zone.newClients}</strong></span>
              <span>Clients récurrents : <strong>{zone.recurringClients}</strong></span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${zone.clientsCount > 0 ? (zone.newClients / (zone.newClients + zone.recurringClients || 1)) * 100 : 0}%`,
                }}
              ></div>
              <div
                className="h-full bg-purple-500"
                style={{
                  width: `${zone.clientsCount > 0 ? (zone.recurringClients / (zone.newClients + zone.recurringClients || 1)) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action de redirection interne sécurisée */}
        <div className="border-t border-slate-100 pt-4 flex gap-2">
          <Link
            href={`/dashboard?search=${encodeURIComponent(zone.name)}`}
            className="w-full text-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-premium transition-premium hover:bg-blue-700"
          >
            Consulter les factures de {zone.name} ➔
          </Link>
        </div>
      </div>
    </div>
  )
}


"use client"

interface GeoChartsProps {
  charts: {
    regionsByPilgrims: Array<{ name: string; pilgrims: number; revenue: number }>
    regionsByRevenue: Array<{ name: string; pilgrims: number; revenue: number }>
    monthlyTrend: Array<{ key: string; label: string; pilgrims: number; revenue: number; invoices: number }>
    airportDistribution: Record<string, number>
    airportByRegionMatrix: Record<string, Record<string, number>>
    clientTypes: {
      new: number
      recurring: number
    }
  }
}

export function GeoCharts({ charts }: GeoChartsProps) {
  const maxPilgrimsReg = Math.max(...charts.regionsByPilgrims.map((r) => r.pilgrims), 1)
  const maxRevenueReg = Math.max(...charts.regionsByRevenue.map((r) => r.revenue), 1)
  const maxMonthlyPilgrims = Math.max(...charts.monthlyTrend.map((m) => m.pilgrims), 1)

  const totalAirportsPilgrims = Object.values(charts.airportDistribution).reduce((a, b) => a + b, 0) || 1
  const totalClients = charts.clientTypes.new + charts.clientTypes.recurring || 1
  const newClientsPct = Math.round((charts.clientTypes.new / totalClients) * 100)
  const recurringClientsPct = Math.round((charts.clientTypes.recurring / totalClients) * 100)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Graphique 1 : Nombre de pèlerins par région (Barres horizontales) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Pèlerins par région</h3>
            <p className="text-xs text-slate-400">Volume total d&apos;inscriptions par zone administrative</p>
          </div>
          <div className="space-y-3">
            {charts.regionsByPilgrims.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Aucune donnée disponible</p>
            ) : (
              charts.regionsByPilgrims.map((reg) => {
                const widthPct = Math.max(8, Math.round((reg.pilgrims / maxPilgrimsReg) * 100))
                return (
                  <div key={reg.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate pr-2">{reg.name}</span>
                      <span className="shrink-0 text-blue-600 font-bold">{reg.pilgrims} pèlerins</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Graphique 3 : Chiffre d'affaires par région */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Chiffre d&apos;affaires par région</h3>
            <p className="text-xs text-slate-400">Poids financier direct généré par chaque territoire</p>
          </div>
          <div className="space-y-3">
            {charts.regionsByRevenue.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Aucune donnée disponible</p>
            ) : (
              charts.regionsByRevenue.map((reg) => {
                const widthPct = Math.max(8, Math.round((reg.revenue / maxRevenueReg) * 100))
                return (
                  <div key={reg.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate pr-2">{reg.name}</span>
                      <span className="shrink-0 text-emerald-600 font-bold">
                        {reg.revenue.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Graphique 2 : Évolution mensuelle des inscriptions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Évolution mensuelle des inscriptions</h3>
            <p className="text-xs text-slate-400">Volume de pèlerins inscrits au fil des mois</p>
          </div>
        </div>

        {charts.monthlyTrend.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-8 text-center">Aucune donnée sur la période sélectionnée</p>
        ) : (
          <div className="pt-6">
            <div className="flex items-end gap-2 h-44 w-full">
              {charts.monthlyTrend.map((m) => {
                const heightPct = Math.max(12, Math.round((m.pilgrims / maxMonthlyPilgrims) * 100))
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.pilgrims}
                    </span>
                    <div
                      className="w-full max-w-[48px] bg-gradient-to-t from-blue-600 to-sky-400 rounded-t-lg transition-all duration-300 hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span className="text-[11px] font-semibold text-slate-500 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Graphique 4 : Répartition par aéroport de départ */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Répartition par aéroport de départ</h3>
            <p className="text-xs text-slate-400">Parts de marché des hubs aéroportuaires utilisés</p>
          </div>
          <div className="space-y-3">
            {Object.entries(charts.airportDistribution).length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Aucun aéroport renseigné</p>
            ) : (
              Object.entries(charts.airportDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([airport, count]) => {
                  const pct = Math.round((count / totalAirportsPilgrims) * 100)
                  return (
                    <div key={airport} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{airport}</span>
                        <span>{count} pèlerin(s) ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* Graphique 5 : Nouveaux clients vs Clients récurrents */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Fidélité & Acquisition</h3>
              <p className="text-xs text-slate-400">Part des nouveaux pèlerins par rapport aux anciens clients</p>
            </div>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Nouveaux clients</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{charts.clientTypes.new}</p>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">{newClientsPct}% du total</p>
              </div>
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Clients récurrents</span>
                <p className="text-2xl font-black text-purple-700 mt-1">{charts.clientTypes.recurring}</p>
                <p className="text-xs font-semibold text-purple-600 mt-0.5">{recurringClientsPct}% du total</p>
              </div>
            </div>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${newClientsPct}%` }}></div>
            <div className="h-full bg-purple-500" style={{ width: `${recurringClientsPct}%` }}></div>
          </div>
        </div>
      </div>

      {/* Section 11 : Analyse croisée Lieu de résidence ↔ Aéroport de départ */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900">Analyse croisée : Lieu de résidence ↔ Aéroport de départ</h3>
          <p className="text-xs text-slate-400">
            Détectez si des pèlerins d&apos;une région se déplacent vers d&apos;autres aéroports (ex: Bordeaux/Sud-Ouest vers Paris ou Toulouse) pour créer de nouvelles offres locales.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-3 pl-4">Région de résidence</th>
                <th className="p-3">Total pèlerins</th>
                <th className="p-3">Répartition des départs</th>
                <th className="p-3 pr-4">Diagnostic opportunité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {Object.keys(charts.airportByRegionMatrix).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                    Aucune donnée croisée disponible
                  </td>
                </tr>
              ) : (
                Object.entries(charts.airportByRegionMatrix).map(([region, airports]) => {
                  const total = Object.values(airports).reduce((a, b) => a + b, 0)
                  const topApt = Object.entries(airports).sort((a, b) => b[1] - a[1])[0]

                  return (
                    <tr key={region} className="hover:bg-slate-50/50 transition-premium">
                      <td className="p-3 pl-4 font-bold text-slate-900">{region}</td>
                      <td className="p-3 text-slate-700">{total}</td>
                      <td className="p-3 text-slate-600">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(airports).map(([apt, count]) => (
                            <span key={apt} className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                              {apt} : <strong>{count}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 pr-4">
                        {total >= 5 ? (
                          <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                            Bassin propice aux départs {topApt ? topApt[0] : ""}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Volume en phase d&apos;amorçage</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


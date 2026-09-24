"use client"

export interface GeoFilterState {
  period: string
  startDate?: string
  endDate?: string
  entityId?: string
  departureAirport?: string
  formulaType?: string
  invoiceStatus?: string
  clientType?: string
}

interface GeoFiltersProps {
  filters: GeoFilterState
  onChange: (newFilters: Partial<GeoFilterState>) => void
  entities: Array<{ id: string; commercialName: string }>
}

export function GeoFilters({ filters, onChange, entities }: GeoFiltersProps) {
  const periodPresets = [
    { label: "30 derniers jours", value: "30d" },
    { label: "3 derniers mois", value: "3m" },
    { label: "6 derniers mois", value: "6m" },
    { label: "Année en cours", value: "this_year" },
    { label: "Année précédente", value: "last_year" },
    { label: "Toutes les données", value: "all" },
  ]

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-premium sm:p-5">
      {/* Raccourcis de périodes */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
          Périodes :
        </span>
        {periodPresets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange({ period: preset.value, startDate: undefined, endDate: undefined })}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-premium cursor-pointer ${
              filters.period === preset.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Filtres détaillés */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Entité / Société */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Société
          </label>
          <select
            value={filters.entityId || "all"}
            onChange={(e) => onChange({ entityId: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          >
            <option value="all">Toutes les entités</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.commercialName}
              </option>
            ))}
          </select>
        </div>

        {/* Aéroport / Ville de départ */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Ville / Aéroport départ
          </label>
          <select
            value={filters.departureAirport || "all"}
            onChange={(e) => onChange({ departureAirport: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          >
            <option value="all">Toutes les villes</option>
            <option value="Paris">Paris</option>
            <option value="Marseille">Marseille</option>
            <option value="Lyon">Lyon</option>
            <option value="Nice">Nice</option>
            <option value="Toulouse">Toulouse</option>
            <option value="Bordeaux">Bordeaux</option>
            <option value="Bruxelles">Bruxelles</option>
            <option value="Charleroi">Charleroi</option>
            <option value="Bâle-Mulhouse">Bâle-Mulhouse</option>
            <option value="Barcelone">Barcelone</option>
            <option value="Madrid">Madrid</option>
            <option value="Malaga">Malaga</option>
            <option value="Cologne">Cologne</option>
          </select>
        </div>

        {/* Statut facture */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Statut dossier
          </label>
          <select
            value={filters.invoiceStatus || "all"}
            onChange={(e) => onChange({ invoiceStatus: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          >
            <option value="all">Tous statuts</option>
            <option value="paid">Payées</option>
            <option value="emitted">Émises / En cours</option>
            <option value="draft">Brouillons</option>
            <option value="late">En retard</option>
          </select>
        </div>

        {/* Type de client */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Type client
          </label>
          <select
            value={filters.clientType || "all"}
            onChange={(e) => onChange({ clientType: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          >
            <option value="all">Nouveaux & Récurrents</option>
            <option value="new">Nouveaux clients</option>
            <option value="recurring">Clients récurrents</option>
          </select>
        </div>

        {/* Date début personnalisée */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Date début
          </label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => onChange({ period: "custom", startDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          />
        </div>

        {/* Date fin personnalisée */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Date fin
          </label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => onChange({ period: "custom", endDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-premium"
          />
        </div>
      </div>
    </div>
  )
}


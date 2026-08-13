import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"

// Helper pour parser la description
function parseInvoiceDescription(description: string) {
  const result = {
    roomType: "double",
    showTravelers: false,
    travelerNames: [] as string[],
    showCityDates: false,
    medinaStart: "",
    medinaEnd: "",
    meccaStart: "",
    meccaEnd: "",
  }

  if (!description) return result

  // Parse Room Type
  const roomMatch = description.match(/Hébergement:\s*chambre\s*([^\r\n]+)/)
  if (roomMatch) {
    const label = roomMatch[1].trim().toLowerCase()
    if (label.includes("single")) result.roomType = "single"
    else if (label.includes("double")) result.roomType = "double"
    else if (label.includes("triple")) result.roomType = "triple"
    else if (label.includes("quad")) result.roomType = "quad"
    else if (label.includes("quintuple")) result.roomType = "quintuple"
  }

  // Parse Medina Dates
  const medinaMatch = description.match(/Hébergement Médine:\s*du\s*(\d{2}\/\d{2}\/\d{4})\s*au\s*(\d{2}\/\d{2}\/\d{4})/)
  if (medinaMatch) {
    result.showCityDates = true
    const parseFRDate = (str: string) => {
      const [d, m, y] = str.split("/")
      return `${y}-${m}-${d}`
    }
    result.medinaStart = parseFRDate(medinaMatch[1])
    result.medinaEnd = parseFRDate(medinaMatch[2])
  }

  // Parse Mecca Dates
  const meccaMatch = description.match(/Hébergement La Mecque:\s*du\s*(\d{2}\/\d{2}\/\d{4})\s*au\s*(\d{2}\/\d{2}\/\d{4})/)
  if (meccaMatch) {
    result.showCityDates = true
    const parseFRDate = (str: string) => {
      const [d, m, y] = str.split("/")
      return `${y}-${m}-${d}`
    }
    result.meccaStart = parseFRDate(meccaMatch[1])
    result.meccaEnd = parseFRDate(meccaMatch[2])
  }

  // Parse Travelers
  const travelersMatch = description.match(/Voyageurs:\s*([^\r\n]+)/)
  if (travelersMatch) {
    result.showTravelers = true
    result.travelerNames = travelersMatch[1].split(",").map(t => t.trim())
  }

  return result
}

function getDatesInRange(start: Date, end: Date) {
  const dates = []
  const curr = new Date(start)
  while (curr <= end) {
    dates.push(new Date(curr))
    curr.setDate(curr.getDate() + 1)
  }
  return dates
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  await requireAuth()

  const params = await searchParams
  const now = new Date()
  const currentMonth = Number(params.month) || now.getMonth() + 1 // 1-12
  const currentYear = Number(params.year) || now.getFullYear()

  // Calcul du nombre de jours dans le mois
  const numDays = new Date(currentYear, currentMonth, 0).getDate()
  const monthStart = new Date(currentYear, currentMonth - 1, 1)
  const monthEnd = new Date(currentYear, currentMonth - 1, numDays, 23, 59, 59)

  // Récupérer toutes les factures actives
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { not: "cancelled" },
      periodStart: { lte: monthEnd },
      periodEnd: { gte: monthStart },
    },
    include: { client: true },
  })

  // Traiter les factures pour calculer la présence journalière
  const daysData = Array.from({ length: numDays }, (_, index) => {
    const dayDate = new Date(currentYear, currentMonth - 1, index + 1)
    const dayStr = dayDate.toISOString().split("T")[0]

    // Voyageurs présents ce jour-là, classés par ville et type de chambre
    const presence = {
      date: dayDate,
      medina: {
        quad: [] as { name: string; invoiceNumber: string; invoiceId: string }[],
        quintuple: [] as { name: string; invoiceNumber: string; invoiceId: string }[],
        private: 0, // Compteur pour info (double, triple, single)
      },
      mecca: {
        quad: [] as { name: string; invoiceNumber: string; invoiceId: string }[],
        quintuple: [] as { name: string; invoiceNumber: string; invoiceId: string }[],
        private: 0,
      },
    }

    invoices.forEach((inv) => {
      if (!inv.periodStart || !inv.periodEnd) return

      const invStart = new Date(inv.periodStart)
      const invEnd = new Date(inv.periodEnd)

      // Si le séjour englobe ce jour
      if (dayDate >= invStart && dayDate <= invEnd) {
        const parsed = parseInvoiceDescription(inv.description)
        const roomType = parsed.roomType

        // Récupérer la liste des noms ou générer des noms par défaut basés sur la quantité
        let travelers = parsed.travelerNames.filter(n => n.trim() !== "")
        if (travelers.length === 0) {
          const qty = inv.quantity || 1
          const mainName = inv.client.firstName ? `${inv.client.firstName} ${inv.client.lastName}` : inv.client.lastName
          travelers = Array.from({ length: qty }, (_, i) => i === 0 ? mainName : `${mainName} (Accompagnant ${i})`)
        }

        // Déterminer la localisation pour ce jour
        let city: "medina" | "mecca" | null = null

        if (parsed.showCityDates) {
          // Si des dates spécifiques ont été enregistrées
          if (parsed.medinaStart && parsed.medinaEnd) {
            const medStart = new Date(parsed.medinaStart + "T00:00:00")
            const medEnd = new Date(parsed.medinaEnd + "T00:00:00")
            if (dayDate >= medStart && dayDate <= medEnd) {
              city = "medina"
            }
          }
          if (parsed.meccaStart && parsed.meccaEnd && !city) {
            const mecStart = new Date(parsed.meccaStart + "T00:00:00")
            const mecEnd = new Date(parsed.meccaEnd + "T00:00:00")
            if (dayDate >= mecStart && dayDate <= mecEnd) {
              city = "mecca"
            }
          }
        }

        // Si aucune date de ville n'est spécifiée, on applique une règle par défaut
        if (!city) {
          const totalDays = Math.ceil((invEnd.getTime() - invStart.getTime()) / (1000 * 60 * 60 * 24))
          const currentDayIndex = Math.ceil((dayDate.getTime() - invStart.getTime()) / (1000 * 60 * 60 * 24))
          
          if (totalDays <= 7) {
            // Formule 1 semaine: Médine en fin de séjour (les 3 derniers jours)
            if (currentDayIndex >= totalDays - 2) {
              city = "medina"
            } else {
              city = "mecca"
            }
          } else {
            // Formule 2 semaines ou plus: Médine au milieu du séjour (3 jours au milieu)
            const medinaStartIndex = Math.floor(totalDays / 2) - 1
            if (currentDayIndex >= medinaStartIndex && currentDayIndex <= medinaStartIndex + 2) {
              city = "medina"
            } else {
              city = "mecca"
            }
          }
        }

        // Ajouter les voyageurs à la bonne catégorie
        if (city) {
          const list = presence[city]
          if (roomType === "quad") {
            travelers.forEach(name => list.quad.push({ name, invoiceNumber: inv.number, invoiceId: inv.id }))
          } else if (roomType === "quintuple") {
            travelers.forEach(name => list.quintuple.push({ name, invoiceNumber: inv.number, invoiceId: inv.id }))
          } else {
            list.private += travelers.length
          }
        }
      }
    })

    return presence
  })

  // Génération des options du sélecteur de mois (sur 6 mois glissants)
  const monthOptions = []
  for (let i = -2; i < 4; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    monthOptions.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader
        links={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/clients", label: "Payeurs" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Planning & Occupation
            </h1>
            <p className="text-sm text-slate-500">
              Visualisez le croisement des dates des pèlerins pour optimiser le remplissage des chambres Quadruples et Quintuples.
            </p>
          </div>

          {/* Sélecteur de mois */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-600">Période :</label>
            <select
              value={`${currentMonth}-${currentYear}`}
              onChange={(e) => {
                // Redirection simple via window.location dans un onChange
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-premium outline-none"
              // eslint-disable-next-line react/no-no-access-state-in-setstate
              // @ts-ignore
              onInput={(e) => {
                const [m, y] = e.currentTarget.value.split("-")
                window.location.href = `/planning?month=${m}&year=${y}`
              }}
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label.charAt(0).toUpperCase() + opt.label.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille principale jour par jour */}
        <div className="space-y-6">
          {daysData.map((day) => {
            const formattedDay = day.date.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })

            const hasActivity =
              day.medina.quad.length > 0 ||
              day.medina.quintuple.length > 0 ||
              day.mecca.quad.length > 0 ||
              day.mecca.quintuple.length > 0

            return (
              <div
                key={day.date.getDate()}
                className={`bg-white rounded-2xl border shadow-premium overflow-hidden transition-premium hover:shadow-card-hover ${
                  hasActivity ? "border-slate-100" : "border-slate-200/40 opacity-60"
                }`}
              >
                {/* En-tête du Jour */}
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 capitalize">{formattedDay}</span>
                  {hasActivity ? (
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 border border-blue-100">
                      {day.medina.quad.length + day.medina.quintuple.length + day.medina.private +
                       day.mecca.quad.length + day.mecca.quintuple.length + day.mecca.private} pèlerin(s)
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Aucun départ/présence</span>
                  )}
                </div>

                {hasActivity && (
                  <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 md:divide-y-0 md:divide-x">
                    {/* Colonne Médine */}
                    <div className="p-5 space-y-4">
                      <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Médine
                      </h3>

                      {/* Quadruple Médine */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400">Formule Quadruple</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.medina.quad.length % 4 === 0 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {day.medina.quad.length} pèlerin(s) 
                            {day.medina.quad.length % 4 !== 0 && ` (Incomplet : -${4 - (day.medina.quad.length % 4)})`}
                          </span>
                        </div>
                        {day.medina.quad.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {day.medina.quad.map((p, idx) => (
                              <Link
                                key={idx}
                                href={`/invoices/${p.invoiceId}`}
                                className="inline-flex items-center gap-1.5 bg-slate-50 border hover:bg-slate-100 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg transition-premium cursor-pointer"
                              >
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-[9px] text-slate-400">({p.invoiceNumber})</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 italic">Aucun pèlerin en Quad</p>
                        )}
                      </div>

                      {/* Quintuple Médine */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400">Formule Quintuple</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.medina.quintuple.length % 5 === 0 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {day.medina.quintuple.length} pèlerin(s) 
                            {day.medina.quintuple.length % 5 !== 0 && ` (Incomplet : -${5 - (day.medina.quintuple.length % 5)})`}
                          </span>
                        </div>
                        {day.medina.quintuple.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {day.medina.quintuple.map((p, idx) => (
                              <Link
                                key={idx}
                                href={`/invoices/${p.invoiceId}`}
                                className="inline-flex items-center gap-1.5 bg-slate-50 border hover:bg-slate-100 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg transition-premium cursor-pointer"
                              >
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-[9px] text-slate-400">({p.invoiceNumber})</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 italic">Aucun pèlerin en Quintuple</p>
                        )}
                      </div>

                      {/* Privé Médine */}
                      {day.medina.private > 0 && (
                        <div className="pt-2 text-xs text-slate-500">
                          ℹ️ <span className="font-semibold">{day.medina.private}</span> pèlerin(s) en chambre privée (Double/Triple/Single)
                        </div>
                      )}
                    </div>

                    {/* Colonne La Mecque */}
                    <div className="p-5 space-y-4">
                      <h3 className="text-sm font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        La Mecque
                      </h3>

                      {/* Quadruple La Mecque */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400">Formule Quadruple</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.mecca.quad.length % 4 === 0 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {day.mecca.quad.length} pèlerin(s) 
                            {day.mecca.quad.length % 4 !== 0 && ` (Incomplet : -${4 - (day.mecca.quad.length % 4)})`}
                          </span>
                        </div>
                        {day.mecca.quad.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {day.mecca.quad.map((p, idx) => (
                              <Link
                                key={idx}
                                href={`/invoices/${p.invoiceId}`}
                                className="inline-flex items-center gap-1.5 bg-slate-50 border hover:bg-slate-100 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg transition-premium cursor-pointer"
                              >
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-[9px] text-slate-400">({p.invoiceNumber})</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 italic">Aucun pèlerin en Quad</p>
                        )}
                      </div>

                      {/* Quintuple La Mecque */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400">Formule Quintuple</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            day.mecca.quintuple.length % 5 === 0 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {day.mecca.quintuple.length} pèlerin(s) 
                            {day.mecca.quintuple.length % 5 !== 0 && ` (Incomplet : -${5 - (day.mecca.quintuple.length % 5)})`}
                          </span>
                        </div>
                        {day.mecca.quintuple.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {day.mecca.quintuple.map((p, idx) => (
                              <Link
                                key={idx}
                                href={`/invoices/${p.invoiceId}`}
                                className="inline-flex items-center gap-1.5 bg-slate-50 border hover:bg-slate-100 text-xs text-slate-700 px-2.5 py-1.5 rounded-lg transition-premium cursor-pointer"
                              >
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-[9px] text-slate-400">({p.invoiceNumber})</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 italic">Aucun pèlerin en Quintuple</p>
                        )}
                      </div>

                      {/* Privé La Mecque */}
                      {day.mecca.private > 0 && (
                        <div className="pt-2 text-xs text-slate-500">
                          ℹ️ <span className="font-semibold">{day.mecca.private}</span> pèlerin(s) en chambre privée (Double/Triple/Single)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

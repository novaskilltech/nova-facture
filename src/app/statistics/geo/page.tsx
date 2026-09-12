import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { AppHeader } from "@/components/AppHeader"
import { GeoDashboard } from "@/components/geo/GeoDashboard"

export const metadata = {
  title: "Analyse géographique - Statistiques commerciales",
  description: "Cartographie et analyse de provenance des pèlerins, chiffre d'affaires et opportunités par région.",
}

export default async function GeoAnalyticsPage() {
  await requireAuth()

  const activeEntities = await prisma.entity.findMany({
    where: { isActive: true },
    select: { id: true, commercialName: true },
    orderBy: { commercialName: "asc" },
  })

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader
        links={[
          { href: "/statistics/geo", label: "Statistiques" },
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/clients", label: "Payeurs" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Entête de page */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Module Décisionnel
              </span>
              <span className="text-xs text-slate-400">• Omra & Logistique</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Analyse Commerciale & Géographique
            </h1>
            <p className="text-sm text-slate-500">
              Visualisez la provenance de vos clients/pèlerins, identifiez les zones à fort potentiel et optimisez vos aéroports de départ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-bold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer"
            >
              Retour Factures
            </a>
          </div>
        </div>

        {/* Dashboard interactif */}
        <GeoDashboard entities={activeEntities} />
      </main>
    </div>
  )
}


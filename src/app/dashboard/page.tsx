import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>
}) {
  await requireAuth()

  const { sortBy, sortOrder } = await searchParams

  const orderField = sortBy || "createdAt"
  const orderDirection = sortOrder === "asc" ? "asc" : "desc"

  let orderByInput: any = { createdAt: "desc" }
  if (orderField === "number") {
    orderByInput = { number: orderDirection }
  } else if (orderField === "date") {
    orderByInput = { date: orderDirection }
  } else if (orderField === "totalTTC") {
    orderByInput = { totalTTC: orderDirection }
  } else if (orderField === "status") {
    orderByInput = { status: orderDirection }
  } else if (orderField === "createdAt") {
    orderByInput = { createdAt: orderDirection }
  }

  const invoices = await prisma.invoice.findMany({
    include: { entity: true, client: true },
    orderBy: orderByInput,
    take: 20,
  })

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    emitted: invoices.filter((i) => i.status === "emitted").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    late: invoices.filter((i) => i.status === "late").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
    totalAmount: invoices
      .filter((i) => i.status !== "cancelled")
      .reduce((sum, i) => sum + i.totalTTC, 0),
    paidAmount: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.totalTTC, 0),
    pendingAmount: invoices
      .filter((i) => i.status === "emitted" || i.status === "late")
      .reduce((sum, i) => sum + i.totalTTC, 0),
  }

  const paidPercentage = stats.totalAmount > 0 
    ? (stats.paidAmount / stats.totalAmount) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/clients", label: "Payeurs" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Entête de Bienvenue */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Espace de Facturation
            </h1>
            <p className="text-sm text-slate-500">
              Bienvenue. Voici le statut de votre facturation d&apos;équipe en temps réel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <a href="/api/export/csv" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer sm:py-2">
              Exporter (CSV)
            </a>
            <Link href="/invoices/new" className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-premium shadow-blue-500/10 transition-premium hover:bg-blue-700 sm:py-2">
              Nouvelle facture
            </Link>
          </div>
        </div>

        {/* Cartes Métriques Premium */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:gap-6 sm:mb-8 lg:grid-cols-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Factures</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 sm:text-3xl">{stats.total}</span>
              <span className="text-xs font-medium text-slate-500">émises</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Brouillons</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-500 sm:text-3xl">{stats.draft}</span>
              <span className="text-xs font-medium text-slate-500">en attente</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: stats.total > 0 ? `${(stats.draft/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Émises / En Cours</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600 sm:text-3xl">{stats.emitted}</span>
              <span className="text-xs font-medium text-slate-500">à percevoir</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: stats.total > 0 ? `${(stats.emitted/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Payées</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 sm:text-3xl">{stats.paid}</span>
              <span className="text-xs font-medium text-slate-500">encaissées</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.total > 0 ? `${(stats.paid/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Module Récapitulatif Financier Moderne */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium mb-8 sm:p-8 sm:mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Flux de Trésorerie Global</h2>
              <p className="text-sm text-slate-400">
                Visualisation des encaissements sur le volume de facturation non annulé.
              </p>
            </div>
            
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 lg:w-auto lg:flex lg:flex-wrap lg:items-center lg:gap-10">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Montant Total Facturé</p>
                <p className="break-words text-2xl font-black text-slate-900 sm:text-3xl">{stats.totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Encaissé</p>
                <p className="break-words text-2xl font-black text-emerald-600 sm:text-3xl">{stats.paidAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Reste à Percevoir</p>
                <p className="break-words text-2xl font-black text-blue-600 sm:text-3xl">{stats.pendingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex flex-col gap-1 text-xs font-bold mb-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-emerald-600">Progression des Encaissements : {paidPercentage.toFixed(1)}%</span>
              <span className="text-slate-400">Objectif 100%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${paidPercentage}%` }}></div>
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: stats.totalAmount > 0 ? `${(stats.pendingAmount/stats.totalAmount)*100}%` : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Tableau des Factures Épuré */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Dernières Factures</h2>
            <Link href="/invoices/new" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-premium">
              Créer une facture ➔
            </Link>
          </div>
          
          <div className="p-4 md:hidden flex flex-wrap items-center gap-2 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500">
            <span className="font-semibold mr-1">Trier :</span>
            <Link href={`/dashboard?sortBy=date&sortOrder=${orderField === 'date' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'date' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
              Date {orderField === 'date' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
            </Link>
            <Link href={`/dashboard?sortBy=totalTTC&sortOrder=${orderField === 'totalTTC' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'totalTTC' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
              Montant {orderField === 'totalTTC' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
            </Link>
            <Link href={`/dashboard?sortBy=number&sortOrder=${orderField === 'number' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'number' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
              Numéro {orderField === 'number' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
            </Link>
          </div>
          
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4 pl-6">
                    <Link href={`/dashboard?sortBy=number&sortOrder=${orderField === 'number' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                      Numéro {orderField === 'number' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                    </Link>
                  </th>
                  <th className="p-4">Société Émettrice</th>
                  <th className="p-4">Client / Payeur</th>
                  <th className="p-4">
                    <Link href={`/dashboard?sortBy=date&sortOrder=${orderField === 'date' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                      Date de Facture {orderField === 'date' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                    </Link>
                  </th>
                  <th className="p-4 text-right">
                    <Link href={`/dashboard?sortBy=totalTTC&sortOrder=${orderField === 'totalTTC' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 justify-end select-none">
                      Montant TTC {orderField === 'totalTTC' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                    </Link>
                  </th>
                  <th className="p-4 text-center">
                    <Link href={`/dashboard?sortBy=status&sortOrder=${orderField === 'status' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 justify-center select-none">
                      Statut {orderField === 'status' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                    </Link>
                  </th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      Aucune facture. Créez votre première facture pour commencer.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-premium">
                      <td className="p-4 pl-6 font-semibold text-slate-900">{invoice.number}</td>
                      <td className="p-4 text-slate-700">{invoice.entity.commercialName}</td>
                      <td className="p-4 text-slate-600">
                        {invoice.client.company || (invoice.client.firstName
                          ? `${invoice.client.firstName} ${invoice.client.lastName}`
                          : invoice.client.lastName)}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(invoice.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {invoice.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="p-4 pr-6 text-center">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-premium inline-block cursor-pointer"
                        >
                          Gérer
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {invoices.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Aucune facture. Créez votre première facture pour commencer.
              </p>
            ) : (
              invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block p-4 transition-premium hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{invoice.number}</p>
                      <p className="truncate text-sm text-slate-600">
                        {invoice.client.company || (invoice.client.firstName
                          ? `${invoice.client.firstName} ${invoice.client.lastName}`
                          : invoice.client.lastName)}
                      </p>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-500">{invoice.entity.commercialName}</p>
                      <p className="text-slate-400">
                        {new Date(invoice.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className="shrink-0 font-black text-slate-900">
                      {invoice.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700 border-amber-200/50",
    emitted: "bg-blue-50 text-blue-700 border-blue-200/50",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    late: "bg-rose-50 text-rose-700 border-rose-200/50",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200/50",
  }
  const labels: Record<string, string> = {
    draft: "Brouillon",
    emitted: "Émise",
    paid: "Payée",
    late: "En retard",
    cancelled: "Annulée",
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${styles[status] || "bg-slate-100 text-slate-600 border-slate-200/50"}`}>
      {labels[status] || status}
    </span>
  )
}

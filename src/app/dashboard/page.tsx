import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"

export default async function DashboardPage() {
  await requireAuth()

  const invoices = await prisma.invoice.findMany({
    include: { entity: true, client: true },
    orderBy: { createdAt: "desc" },
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Entête de Bienvenue */}
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Espace de Facturation
            </h1>
            <p className="text-sm text-slate-500">
              Bienvenue. Voici le statut de votre facturation d&apos;équipe en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/export/csv" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-premium shadow-premium text-sm cursor-pointer">
              Exporter (CSV)
            </a>
            <Link href="/invoices/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-premium shadow-premium shadow-blue-500/10 text-sm">
              Nouvelle facture
            </Link>
          </div>
        </div>

        {/* Cartes Métriques Premium */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Factures</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.total}</span>
              <span className="text-xs font-medium text-slate-500">émises</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Brouillons</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-500">{stats.draft}</span>
              <span className="text-xs font-medium text-slate-500">en attente</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: stats.total > 0 ? `${(stats.draft/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Émises / En Cours</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-600">{stats.emitted}</span>
              <span className="text-xs font-medium text-slate-500">à percevoir</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: stats.total > 0 ? `${(stats.emitted/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium transition-premium hover:shadow-card-hover group">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Payées</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">{stats.paid}</span>
              <span className="text-xs font-medium text-slate-500">encaissées</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-emerald-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.total > 0 ? `${(stats.paid/stats.total)*100}%` : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Module Récapitulatif Financier Moderne */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-premium mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Flux de Trésorerie Global</h2>
              <p className="text-sm text-slate-400">
                Visualisation des encaissements sur le volume de facturation non annulé.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-10 items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Montant Total Facturé</p>
                <p className="text-3xl font-black text-slate-900">{stats.totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
              <div>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Encaissé</p>
                <p className="text-3xl font-black text-emerald-600">{stats.paidAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
              <div>
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Reste à Percevoir</p>
                <p className="text-3xl font-black text-blue-600">{stats.pendingAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
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
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Dernières Factures</h2>
            <Link href="/invoices/new" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-premium">
              Créer une facture ➔
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4 pl-6">Numéro</th>
                  <th className="p-4">Société Émettrice</th>
                  <th className="p-4">Client / Payeur</th>
                  <th className="p-4">Date de Facture</th>
                  <th className="p-4 text-right">Montant TTC</th>
                  <th className="p-4 text-center">Statut</th>
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

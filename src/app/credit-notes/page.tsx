import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"
import { Prisma } from "@prisma/client"

export default async function CreditNotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    entityId?: string
    search?: string
    page?: string
  }>
}) {
  await requireAuth()

  const { status, entityId, search, page: pageParam } = await searchParams
  const filterStatus = status || "all"
  const filterEntityId = entityId || "all"
  const searchQuery = search || ""
  const currentPage = Number(pageParam) || 1

  const activeEntities = await prisma.entity.findMany({
    where: { isActive: true },
    select: { id: true, commercialName: true },
    orderBy: { commercialName: "asc" },
  })

  const whereInput: Prisma.CreditNoteWhereInput = {}
  if (filterStatus !== "all") {
    whereInput.status = filterStatus
  }
  if (filterEntityId !== "all") {
    whereInput.entityId = filterEntityId
  }
  if (searchQuery) {
    whereInput.OR = [
      { number: { contains: searchQuery } },
      { invoice: { number: { contains: searchQuery } } },
      { client: { lastName: { contains: searchQuery } } },
      { client: { firstName: { contains: searchQuery } } },
      { client: { company: { contains: searchQuery } } },
      { reason: { contains: searchQuery } },
    ]
  }

  const allCreditNotes = await prisma.creditNote.findMany({
    where: whereInput,
    include: {
      entity: true,
      client: true,
      invoice: {
        select: { id: true, number: true, totalTTC: true },
      },
      refunds: true,
    },
    orderBy: { date: "desc" },
  })

  // Statistiques financières
  const stats = {
    totalCount: allCreditNotes.length,
    pendingCount: allCreditNotes.filter((cn) => cn.status === "pending").length,
    refundedCount: allCreditNotes.filter((cn) => cn.status === "refunded").length,
    totalAmountTTC: allCreditNotes.reduce((sum, cn) => sum + cn.totalTTC, 0),
    totalRefunded: allCreditNotes.reduce((sum, cn) => {
      const refunded = cn.refunds.reduce((rSum, r) => rSum + r.amount, 0)
      return sum + refunded
    }, 0),
  }
  const totalRemainingToRefund = Math.max(0, stats.totalAmountTTC - stats.totalRefunded)

  const limit = 20
  const totalNotes = allCreditNotes.length
  const totalPages = Math.ceil(totalNotes / limit) || 1
  const page = Math.min(Math.max(1, currentPage), totalPages)
  const skip = (page - 1) * limit
  const creditNotes = allCreditNotes.slice(skip, skip + limit)

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
        {/* Entête */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Avoirs &amp; Remboursements
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestion comptable des annulations, avoirs émis et remboursements de trésorerie.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-premium transition-premium hover:bg-slate-50"
            >
              Voir les factures
            </Link>
          </div>
        </div>

        {/* Cartes Métriques */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:gap-6 sm:mb-8 lg:grid-cols-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Avoirs Émis</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 sm:text-3xl">
                {stats.totalAmountTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {stats.totalCount} document(s) d&apos;avoir
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Remboursements Effectués</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 sm:text-3xl">
                {stats.totalRefunded.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Sorties de trésorerie validées
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Reste à Rembourser</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 sm:text-3xl">
                {totalRemainingToRefund.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              En attente de paiement client
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-premium transition-premium sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Statuts Avoirs</p>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-xl font-black text-amber-500">{stats.pendingCount}</span>
                <span className="text-[10px] block font-bold text-slate-400 uppercase">À rembourser</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div>
                <span className="text-xl font-black text-emerald-600">{stats.refundedCount}</span>
                <span className="text-[10px] block font-bold text-slate-400 uppercase">Soldés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-4 mb-6 sm:p-6">
          <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-center">
            <div className="sm:col-span-2">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Rechercher par n° avoir, n° facture, nom client, motif..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <select
                name="status"
                defaultValue={filterStatus}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente de remboursement</option>
                <option value="partially_refunded">Partiellement remboursé</option>
                <option value="refunded">Totalement remboursé</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                name="entityId"
                defaultValue={filterEntityId}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Toutes les sociétés</option>
                {activeEntities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.commercialName}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-blue-700 cursor-pointer"
              >
                Filtrer
              </button>
            </div>
          </form>
        </div>

        {/* Table des Avoirs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="p-4 pl-6">N° Avoir</th>
                  <th className="p-4">Facture d&apos;origine</th>
                  <th className="p-4">Client</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Motif</th>
                  <th className="p-4 text-right">Montant TTC</th>
                  <th className="p-4 text-right">Remboursé</th>
                  <th className="p-4 text-right">Reste</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400">
                      Aucun avoir enregistré selon les critères actuels.
                    </td>
                  </tr>
                ) : (
                  creditNotes.map((cn) => {
                    const refunded = cn.refunds.reduce((sum, r) => sum + r.amount, 0)
                    const remaining = Math.max(0, cn.totalTTC - refunded)
                    return (
                      <tr key={cn.id} className="hover:bg-slate-50/50 transition-premium">
                        <td className="p-4 pl-6 font-bold text-rose-600">{cn.number}</td>
                        <td className="p-4">
                          <Link
                            href={`/invoices/${cn.invoice.id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {cn.invoice.number}
                          </Link>
                        </td>
                        <td className="p-4 text-slate-700">
                          {cn.client.company ||
                            (cn.client.firstName
                              ? `${cn.client.firstName} ${cn.client.lastName}`
                              : cn.client.lastName)}
                        </td>
                        <td className="p-4 text-slate-500">
                          {new Date(cn.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-4 text-slate-600 text-xs">{cn.reason}</td>
                        <td className="p-4 text-right font-black text-rose-600">
                          -{cn.totalTTC.toFixed(2)} €
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-600">
                          {refunded.toFixed(2)} €
                        </td>
                        <td className="p-4 text-right font-semibold text-slate-800">
                          {remaining.toFixed(2)} €
                        </td>
                        <td className="p-4 text-center">
                          <CreditNoteStatusBadge status={cn.status} />
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <Link
                            href={`/credit-notes/${cn.id}`}
                            className="px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-premium inline-block cursor-pointer"
                          >
                            Détails &amp; Payout
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Version Mobile Card */}
          <div className="divide-y divide-slate-100 md:hidden">
            {creditNotes.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                Aucun avoir enregistré.
              </p>
            ) : (
              creditNotes.map((cn) => {
                const refunded = cn.refunds.reduce((sum, r) => sum + r.amount, 0)
                const remaining = Math.max(0, cn.totalTTC - refunded)
                return (
                  <Link
                    key={cn.id}
                    href={`/credit-notes/${cn.id}`}
                    className="block p-4 transition-premium hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-rose-600">{cn.number}</p>
                        <p className="text-xs text-slate-500">Facture : {cn.invoice.number}</p>
                      </div>
                      <CreditNoteStatusBadge status={cn.status} />
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      <p className="font-semibold">
                        {cn.client.company ||
                          (cn.client.firstName
                            ? `${cn.client.firstName} ${cn.client.lastName}`
                            : cn.client.lastName)}
                      </p>
                      <p className="text-slate-400 mt-0.5">Motif : {cn.reason}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                      <div>
                        <span className="text-slate-400">Total Avoir : </span>
                        <span className="font-bold text-rose-600">-{cn.totalTTC.toFixed(2)} €</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Reste à payer : </span>
                        <span className="font-bold text-slate-800">{remaining.toFixed(2)} €</span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function CreditNoteStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200/50",
    partially_refunded: "bg-blue-50 text-blue-700 border-blue-200/50",
    refunded: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  }
  const labels: Record<string, string> = {
    pending: "À rembourser",
    partially_refunded: "Partiellement remboursé",
    refunded: "Remboursé",
  }

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200/50"
      }`}
    >
      {labels[status] || status}
    </span>
  )
}

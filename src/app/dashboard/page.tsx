import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"

export default async function DashboardPage() {
  await requireAuth()

  const [invoices, entities, clients] = await Promise.all([
    prisma.invoice.findMany({
      include: { entity: true, client: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.entity.findMany({ where: { isActive: true } }),
    prisma.client.count(),
  ])

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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nova Facture</h1>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Tableau de bord
          </Link>
          <Link href="/invoices/new" className="text-blue-600 hover:underline">
            Nouvelle facture
          </Link>
          <Link href="/clients" className="text-blue-600 hover:underline">
            Payeurs
          </Link>
          <Link href="/entities" className="text-blue-600 hover:underline">
            Sociétés
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-red-600 hover:underline">
              Déconnexion
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total factures</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Brouillons</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Émises</p>
            <p className="text-3xl font-bold text-blue-600">{stats.emitted}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Payées</p>
            <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Montant total</h2>
            <p className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} €</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dernières factures</h2>
            <div className="flex gap-3">
              <a href="/api/export/csv" className="text-blue-600 hover:underline text-sm px-3 py-2 border rounded-md">
                Export CSV
              </a>
              <Link href="/invoices/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Nouvelle facture
              </Link>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-4">Numéro</th>
                <th className="p-4">Entité</th>
                <th className="p-4">Payeur</th>
                <th className="p-4">Date</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Aucune facture. Créez votre première facture.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{invoice.number}</td>
                    <td className="p-4">{invoice.entity.commercialName}</td>
                    <td className="p-4">
                      {invoice.client.firstName
                        ? `${invoice.client.firstName} ${invoice.client.lastName}`
                        : invoice.client.lastName}
                    </td>
                    <td className="p-4">{new Date(invoice.date).toLocaleDateString("fr-FR")}</td>
                    <td className="p-4 font-medium">{invoice.totalTTC.toFixed(2)} €</td>
                    <td className="p-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    emitted: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    late: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  }
  const labels: Record<string, string> = {
    draft: "Brouillon",
    emitted: "Émise",
    paid: "Payée",
    late: "En retard",
    cancelled: "Annulée",
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  )
}

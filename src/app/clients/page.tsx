import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { NewClientForm } from "@/components/NewClientForm"

export default async function ClientsPage() {
  await requireAuth()

  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
  })

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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Payeurs</h2>
          <NewClientForm />
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-4">Nom</th>
                <th className="p-4">Entreprise</th>
                <th className="p-4">Email</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Factures</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucun payeur enregistré.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {client.firstName
                        ? `${client.firstName} ${client.lastName}`
                        : client.lastName}
                    </td>
                    <td className="p-4">{client.company || "-"}</td>
                    <td className="p-4">{client.email || "-"}</td>
                    <td className="p-4">{client.phone || "-"}</td>
                    <td className="p-4">
                      <ClientInvoiceCount id={client.id} />
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

async function ClientInvoiceCount({ id }: { id: string }) {
  const count = await prisma.invoice.count({ where: { clientId: id } })
  return <span className="text-sm text-gray-500">{count}</span>
}

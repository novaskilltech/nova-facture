import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EditEntityRibForm } from "@/components/EditEntityRibForm"
import Link from "next/link"

export default async function EntitiesPage() {
  await requireAuth()

  const entities = await prisma.entity.findMany({
    where: { isActive: true },
    orderBy: { commercialName: "asc" },
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
          <Link href="/clients" className="text-blue-600 hover:underline">
            Payeurs
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-red-600 hover:underline">
              Déconnexion
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Sociétés</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les coordonnées bancaires utilisées sur les factures.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-4">Société</th>
                <th className="p-4">Banque</th>
                <th className="p-4">Titulaire</th>
                <th className="p-4">IBAN</th>
                <th className="p-4">BIC</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-b hover:bg-gray-50 align-top">
                  <td className="p-4">
                    <p className="font-medium">{entity.commercialName}</p>
                    <p className="text-sm text-gray-500">{entity.legalName}</p>
                  </td>
                  <td className="p-4">{entity.bankName}</td>
                  <td className="p-4">{entity.bankHolder}</td>
                  <td className="p-4 font-mono text-sm">{entity.bankIban}</td>
                  <td className="p-4 font-mono text-sm">{entity.bankBic}</td>
                  <td className="p-4">
                    <EditEntityRibForm entity={entity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}

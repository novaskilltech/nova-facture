import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { EditEntityRibForm } from "@/components/EditEntityRibForm"
import { AppHeader } from "@/components/AppHeader"

export default async function EntitiesPage() {
  await requireAuth()

  const entities = await prisma.entity.findMany({
    where: { isActive: true },
    orderBy: { commercialName: "asc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/clients", label: "Payeurs" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Sociétés</h2>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les coordonnées bancaires utilisées sur les factures.
            </p>
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
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
        </div>

        <div className="space-y-3 md:hidden">
          {entities.map((entity) => (
            <div key={entity.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{entity.commercialName}</p>
                  <p className="text-sm text-gray-500">{entity.legalName}</p>
                </div>
                <EditEntityRibForm entity={entity} />
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">Banque</dt>
                  <dd className="font-medium text-gray-700">{entity.bankName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">Titulaire</dt>
                  <dd className="font-medium text-gray-700">{entity.bankHolder}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">IBAN</dt>
                  <dd className="break-all font-mono text-gray-700">{entity.bankIban}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">BIC</dt>
                  <dd className="break-all font-mono text-gray-700">{entity.bankBic}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

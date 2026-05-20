import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NewClientForm } from "@/components/NewClientForm"
import { AppHeader } from "@/components/AppHeader"

export default async function ClientsPage() {
  await requireAuth()

  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Payeurs</h2>
          <NewClientForm />
        </div>

        <div className="hidden overflow-hidden rounded-lg bg-white shadow sm:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
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
        </div>

        <div className="space-y-3 sm:hidden">
          {clients.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500 shadow">
              Aucun payeur enregistré.
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {client.firstName
                        ? `${client.firstName} ${client.lastName}`
                        : client.lastName}
                    </p>
                    <p className="truncate text-sm text-gray-500">{client.company || "Sans entreprise"}</p>
                  </div>
                  <ClientInvoiceCount id={client.id} />
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p className="truncate">{client.email || "Email non renseigné"}</p>
                  <p>{client.phone || "Téléphone non renseigné"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

async function ClientInvoiceCount({ id }: { id: string }) {
  const count = await prisma.invoice.count({ where: { clientId: id } })
  return <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-600">{count}</span>
}

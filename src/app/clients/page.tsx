import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { NewClientForm } from "@/components/NewClientForm"
import { AppHeader } from "@/components/AppHeader"
import { Prisma } from "@prisma/client"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>
}) {
  await requireAuth()

  const { sortBy, sortOrder } = await searchParams

  const orderField = sortBy || "updatedAt"
  const orderDirection = sortOrder === "asc" ? "asc" : "desc"

  let orderByInput: Prisma.ClientOrderByWithRelationInput | Prisma.ClientOrderByWithRelationInput[] = { updatedAt: "desc" }
  if (orderField === "name") {
    orderByInput = [
      { lastName: orderDirection },
      { firstName: orderDirection }
    ]
  } else if (orderField === "company") {
    orderByInput = { company: orderDirection }
  } else if (orderField === "email") {
    orderByInput = { email: orderDirection }
  } else if (orderField === "phone") {
    orderByInput = { phone: orderDirection }
  } else if (orderField === "invoiceCount") {
    orderByInput = {
      invoices: {
        _count: orderDirection
      }
    }
  }

  const clients = await prisma.client.findMany({
    orderBy: orderByInput,
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
          <div className="flex items-center gap-3">
            <a
              href="/api/export/clients"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer sm:py-2"
            >
              Exporter les clients (CSV)
            </a>
            <NewClientForm />
          </div>
        </div>

        <div className="p-4 md:hidden flex flex-wrap items-center gap-2 bg-slate-50/50 border rounded-lg mb-4 text-xs text-slate-500">
          <span className="font-semibold mr-1">Trier :</span>
          <Link href={`/clients?sortBy=name&sortOrder=${orderField === 'name' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'name' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
            Nom {orderField === 'name' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
          </Link>
          <Link href={`/clients?sortBy=company&sortOrder=${orderField === 'company' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'company' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
            Entreprise {orderField === 'company' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
          </Link>
          <Link href={`/clients?sortBy=invoiceCount&sortOrder=${orderField === 'invoiceCount' && orderDirection === 'desc' ? 'asc' : 'desc'}`} className={`px-2.5 py-1 rounded-md bg-white border shadow-sm ${orderField === 'invoiceCount' ? 'text-blue-600 border-blue-200 bg-blue-50/20 font-bold' : 'border-slate-200'}`}>
            Factures {orderField === 'invoiceCount' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
          </Link>
        </div>

        <div className="hidden overflow-hidden rounded-lg bg-white shadow sm:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-4">
                  <Link href={`/clients?sortBy=name&sortOrder=${orderField === 'name' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                    Nom {orderField === 'name' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                  </Link>
                </th>
                <th className="p-4">
                  <Link href={`/clients?sortBy=company&sortOrder=${orderField === 'company' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                    Entreprise {orderField === 'company' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                  </Link>
                </th>
                <th className="p-4">
                  <Link href={`/clients?sortBy=email&sortOrder=${orderField === 'email' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                    Email {orderField === 'email' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                  </Link>
                </th>
                <th className="p-4">
                  <Link href={`/clients?sortBy=phone&sortOrder=${orderField === 'phone' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                    Téléphone {orderField === 'phone' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                  </Link>
                </th>
                <th className="p-4">
                  <Link href={`/clients?sortBy=invoiceCount&sortOrder=${orderField === 'invoiceCount' && orderDirection === 'asc' ? 'desc' : 'asc'}`} className="hover:underline flex items-center gap-1 select-none">
                    Factures {orderField === 'invoiceCount' ? (orderDirection === 'asc' ? '▲' : '▼') : ''}
                  </Link>
                </th>
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

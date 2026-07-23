import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NewClientForm } from "@/components/NewClientForm"
import { AppHeader } from "@/components/AppHeader"
import { ClientsListWrapper } from "@/components/ClientsListWrapper"
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
    include: {
      invoices: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          number: true,
          totalTTC: true,
          status: true,
          date: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Clients & Payeurs</h2>
            <p className="text-xs text-slate-500 mt-1">
              Cliquez sur un client pour afficher sa fiche complète ou modifier ses coordonnées.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/export/clients"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer sm:py-2"
            >
              Exporter (CSV)
            </a>
            <NewClientForm />
          </div>
        </div>

        <ClientsListWrapper
          initialClients={clients}
          orderField={orderField}
          orderDirection={orderDirection}
        />
      </main>
    </div>
  )
}


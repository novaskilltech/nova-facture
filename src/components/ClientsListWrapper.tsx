"use client"

import { useState } from "react"
import { ClientData, ClientDetailDrawer } from "./ClientDetailDrawer"
import Link from "next/link"

interface ClientsListWrapperProps {
  initialClients: (ClientData & { _count?: { invoices: number } })[]
  orderField: string
  orderDirection: string
}

export function ClientsListWrapper({
  initialClients,
  orderField,
  orderDirection,
}: ClientsListWrapperProps) {
  const [clients, setClients] = useState(initialClients)
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [search, setSearch] = useState("")

  const handleRowClick = async (client: ClientData) => {
    setSelectedClient(client)
    // Optionnel: Récupérer les factures complètes fraîches via l'API route
    try {
      const res = await fetch(`/api/clients/${client.id}`)
      if (res.ok) {
        const fullData = await res.json()
        setSelectedClient(fullData)
      }
    } catch (e) {
      console.error("Erreur chargement détails client:", e)
    }
  }

  const handleClientUpdated = (updatedClient: ClientData) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? { ...c, ...updatedClient } : c))
    )
    setSelectedClient(updatedClient)
  }

  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    const name = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase()
    const company = (c.company || "").toLowerCase()
    const email = (c.email || "").toLowerCase()
    const phone = (c.phone || "").toLowerCase()
    return name.includes(term) || company.includes(term) || email.includes(term) || phone.includes(term)
  })

  return (
    <div>
      {/* Search Input Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom, entreprise, email, tél..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <svg
            className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick info tag */}
        <span className="text-xs text-slate-500 font-medium">
          {filteredClients.length} client{filteredClients.length > 1 ? "s" : ""} trouvé{filteredClients.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile Sort Controls */}
      <div className="p-3 md:hidden flex flex-wrap items-center gap-2 bg-slate-50 border rounded-xl mb-4 text-xs text-slate-500">
        <span className="font-semibold mr-1">Trier :</span>
        <Link
          href={`/clients?sortBy=name&sortOrder=${orderField === "name" && orderDirection === "desc" ? "asc" : "desc"}`}
          className={`px-2.5 py-1 rounded-md bg-white border shadow-2xs ${
            orderField === "name" ? "text-blue-600 border-blue-200 bg-blue-50/20 font-bold" : "border-slate-200"
          }`}
        >
          Nom {orderField === "name" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
        </Link>
        <Link
          href={`/clients?sortBy=company&sortOrder=${orderField === "company" && orderDirection === "desc" ? "asc" : "desc"}`}
          className={`px-2.5 py-1 rounded-md bg-white border shadow-2xs ${
            orderField === "company" ? "text-blue-600 border-blue-200 bg-blue-50/20 font-bold" : "border-slate-200"
          }`}
        >
          Entreprise {orderField === "company" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
        </Link>
        <Link
          href={`/clients?sortBy=invoiceCount&sortOrder=${orderField === "invoiceCount" && orderDirection === "desc" ? "asc" : "desc"}`}
          className={`px-2.5 py-1 rounded-md bg-white border shadow-2xs ${
            orderField === "invoiceCount" ? "text-blue-600 border-blue-200 bg-blue-50/20 font-bold" : "border-slate-200"
          }`}
        >
          Factures {orderField === "invoiceCount" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
        </Link>
      </div>

      {/* Desktop Table View */}
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-premium border border-slate-100 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="p-4">
                  <Link
                    href={`/clients?sortBy=name&sortOrder=${orderField === "name" && orderDirection === "asc" ? "desc" : "asc"}`}
                    className="hover:underline flex items-center gap-1 select-none"
                  >
                    Nom & Prénom {orderField === "name" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
                  </Link>
                </th>
                <th className="p-4">
                  <Link
                    href={`/clients?sortBy=company&sortOrder=${orderField === "company" && orderDirection === "asc" ? "desc" : "asc"}`}
                    className="hover:underline flex items-center gap-1 select-none"
                  >
                    Entreprise {orderField === "company" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
                  </Link>
                </th>
                <th className="p-4">
                  <Link
                    href={`/clients?sortBy=email&sortOrder=${orderField === "email" && orderDirection === "asc" ? "desc" : "asc"}`}
                    className="hover:underline flex items-center gap-1 select-none"
                  >
                    Email {orderField === "email" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
                  </Link>
                </th>
                <th className="p-4">
                  <Link
                    href={`/clients?sortBy=phone&sortOrder=${orderField === "phone" && orderDirection === "asc" ? "desc" : "asc"}`}
                    className="hover:underline flex items-center gap-1 select-none"
                  >
                    Téléphone {orderField === "phone" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
                  </Link>
                </th>
                <th className="p-4 text-center">
                  <Link
                    href={`/clients?sortBy=invoiceCount&sortOrder=${orderField === "invoiceCount" && orderDirection === "asc" ? "desc" : "asc"}`}
                    className="hover:underline flex items-center justify-center gap-1 select-none"
                  >
                    Factures {orderField === "invoiceCount" ? (orderDirection === "asc" ? "▲" : "▼") : ""}
                  </Link>
                </th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleRowClick(client)}
                    className="cursor-pointer transition-colors hover:bg-blue-50/40 group"
                  >
                    <td className="p-4 font-semibold text-slate-900 group-hover:text-blue-600">
                      {client.firstName ? `${client.firstName} ${client.lastName}` : client.lastName}
                    </td>
                    <td className="p-4 font-medium text-slate-600">{client.company || "-"}</td>
                    <td className="p-4 text-slate-500">{client.email || "-"}</td>
                    <td className="p-4 text-slate-500">{client.phone || "-"}</td>
                    <td className="p-4 text-center">
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                        {client.invoices?.length ?? client._count?.invoices ?? 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRowClick(client)
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs"
                      >
                        Voir la fiche ➜
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 sm:hidden">
        {filteredClients.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm border border-slate-100 italic">
            Aucun client trouvé.
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleRowClick(client)}
              className="cursor-pointer rounded-xl bg-white p-4 shadow-sm border border-slate-100 active:scale-[0.99] transition-all hover:border-blue-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {client.firstName ? `${client.firstName} ${client.lastName}` : client.lastName}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {client.company || "Sans entreprise"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {client.invoices?.length ?? client._count?.invoices ?? 0} fac.
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-50 pt-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-slate-500">{client.email || "Email non renseigné"}</p>
                  <p className="text-slate-500">{client.phone || "Tél non renseigné"}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 shrink-0 ml-2">Fiche ➜</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lateral Drawer for Details & Edit */}
      <ClientDetailDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  )
}

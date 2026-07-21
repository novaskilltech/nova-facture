"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function StatusFilter({ currentStatus }: { currentStatus: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === "all") {
      params.delete("status")
    } else {
      params.set("status", e.target.value)
    }
    params.delete("page")
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    >
      <option value="all">Toutes les factures</option>
      <option value="draft">Brouillons</option>
      <option value="emitted">Émises</option>
      <option value="paid">Payées</option>
      <option value="late">En retard</option>
      <option value="cancelled">Annulées</option>
    </select>
  )
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface EntityOption {
  id: string
  commercialName: string
}

export function EntityFilter({
  entities,
  currentEntityId,
}: {
  entities: EntityOption[]
  currentEntityId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === "all") {
      params.delete("entityId")
    } else {
      params.set("entityId", e.target.value)
    }
    params.delete("page")
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <select
      value={currentEntityId}
      onChange={handleChange}
      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    >
      <option value="all">Toutes les sociétés</option>
      {entities.map((entity) => (
        <option key={entity.id} value={entity.id}>
          {entity.commercialName}
        </option>
      ))}
    </select>
  )
}

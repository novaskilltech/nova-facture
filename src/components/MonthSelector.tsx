"use client"

import { useRouter } from "next/navigation"

interface MonthSelectorProps {
  currentMonth: number
  currentYear: number
  options: { month: number; year: number; label: string }[]
}

export function MonthSelector({ currentMonth, currentYear, options }: MonthSelectorProps) {
  const router = useRouter()
  return (
    <select
      value={`${currentMonth}-${currentYear}`}
      onChange={(e) => {
        const [m, y] = e.target.value.split("-")
        router.push(`/planning?month=${m}&year=${y}`)
      }}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-premium outline-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
          {opt.label.charAt(0).toUpperCase() + opt.label.slice(1)}
        </option>
      ))}
    </select>
  )
}

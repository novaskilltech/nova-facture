"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

interface InvoiceStatusSelectorProps {
  id: string
  currentStatus: string
}

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "emitted", label: "Émise" },
  { value: "paid", label: "Payée" },
  { value: "late", label: "En retard" },
  { value: "cancelled", label: "Annulée" },
]

export function InvoiceStatusSelector({
  id,
  currentStatus,
}: InvoiceStatusSelectorProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()

  async function updateStatus(nextStatus: string) {
    const previousStatus = status
    setStatus(nextStatus)

    const response = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (!response.ok) {
      setStatus(previousStatus)
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <select
      value={status}
      onChange={(event) => updateStatus(event.target.value)}
      disabled={isPending}
      className="w-full rounded-md border px-2 py-2 text-sm sm:w-auto sm:py-1"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

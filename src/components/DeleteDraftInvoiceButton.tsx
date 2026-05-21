"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeleteDraftInvoiceButtonProps {
  id: string
}

export function DeleteDraftInvoiceButton({ id }: DeleteDraftInvoiceButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  async function deleteInvoice() {
    const confirmed = window.confirm(
      "Supprimer définitivement cette facture brouillon ?"
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setError("")

    const response = await fetch(`/api/invoices/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || "Erreur lors de la suppression")
      setIsDeleting(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={deleteInvoice}
        disabled={isDeleting}
        className="w-full rounded-md border border-red-200 bg-white px-4 py-2.5 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
      >
        {isDeleting ? "Suppression..." : "Supprimer le brouillon"}
      </button>
      {error && (
        <p className="mt-2 max-w-48 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

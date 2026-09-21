"use client"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { CreditNotePDF } from "./CreditNotePDF"

interface CreditNotePDFDownloadButtonProps {
  creditNote: any
}

export function CreditNotePDFDownloadButton({ creditNote }: CreditNotePDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)
      const blob = await pdf(<CreditNotePDF creditNote={creditNote} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Avoir-${creditNote.number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erreur lors de la génération du PDF d'avoir", err)
      alert("Erreur lors du téléchargement du PDF.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      setLoading(true)
      const blob = await pdf(<CreditNotePDF creditNote={creditNote} />).toBlob()
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.focus()
      }
    } catch (err) {
      console.error("Erreur lors de l'impression", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-premium transition-premium hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Génération..." : "Télécharger PDF"}
      </button>
      <button
        type="button"
        onClick={handlePrint}
        disabled={loading}
        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
      >
        Imprimer
      </button>
    </div>
  )
}


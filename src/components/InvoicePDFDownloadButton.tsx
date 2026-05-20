"use client"

import { PDFDownloadLink } from "@react-pdf/renderer"
import { InvoicePDF, type InvoicePDFProps } from "@/components/InvoicePDF"

interface InvoicePDFDownloadButtonProps {
  invoice: InvoicePDFProps["invoice"]
  fileName: string
}

export function InvoicePDFDownloadButton({
  invoice,
  fileName,
}: InvoicePDFDownloadButtonProps) {
  const logoSrc =
    typeof window === "undefined"
      ? "/horizon-solutions-logo.jpg"
      : new URL("/horizon-solutions-logo.jpg", window.location.origin).toString()

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} logoSrc={logoSrc} />}
      fileName={fileName}
      className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-blue-700 sm:w-auto sm:py-2"
    >
      {({ loading }) => (loading ? "Génération..." : "Télécharger PDF")}
    </PDFDownloadLink>
  )
}

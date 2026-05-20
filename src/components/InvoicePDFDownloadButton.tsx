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
      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
    >
      {({ loading }) => (loading ? "Génération..." : "Télécharger PDF")}
    </PDFDownloadLink>
  )
}

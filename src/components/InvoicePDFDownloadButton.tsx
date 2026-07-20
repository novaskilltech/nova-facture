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
  const getLogoPath = (entityId?: string) => {
    switch (entityId) {
      case "entity-conciergerie":
        return "/conciergerie-logo.jpg"
      case "entity-horizon-services":
        return "/horizon-services-logo.png"
      default:
        return "/horizon-solutions-logo.jpg"
    }
  }

  const logoPath = getLogoPath(invoice.entity.id)

  const logoSrc =
    typeof window === "undefined"
      ? logoPath
      : new URL(logoPath, window.location.origin).toString()

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

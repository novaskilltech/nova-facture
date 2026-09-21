import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/AppHeader"
import { NewCreditNoteForm } from "@/components/NewCreditNoteForm"

export default async function NewCreditNotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      entity: true,
      client: true,
      creditNotes: true,
    },
  })

  if (!invoice) {
    notFound()
  }

  // Calcul du prochain numéro séquentiel d'avoir (AV-YYYY-XXXX)
  const currentYear = new Date().getFullYear()
  const prefixYear = `AV-${currentYear}-`
  const existingCreditNotes = await prisma.creditNote.findMany({
    where: {
      number: { startsWith: prefixYear },
    },
    select: { number: true },
  })

  const pattern = new RegExp(`^AV-${currentYear}-(\\d+)$`, "i")
  let highestSequence = 0
  existingCreditNotes.forEach((cn) => {
    const match = cn.number.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > highestSequence) {
        highestSequence = num
      }
    }
  })

  const nextSeq = highestSequence + 1
  const suggestedNumber = `AV-${currentYear}-${String(nextSeq).padStart(4, "0")}`

  return (
    <div className="min-h-screen bg-slate-50/50">
      <AppHeader
        links={[
          { href: "/invoices/new", label: "Nouvelle facture" },
          { href: "/credit-notes", label: "Avoirs" },
          { href: "/clients", label: "Payeurs" },
          { href: "/entities", label: "Sociétés" },
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                Facture {invoice.number}
              </Link>
              <span>/</span>
              <span className="text-slate-800">Émettre un avoir</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Créer un avoir comptable
            </h1>
          </div>
          <Link
            href={`/invoices/${invoice.id}`}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-premium transition-premium hover:bg-slate-50 cursor-pointer"
          >
            Retour facture
          </Link>
        </div>

        <NewCreditNoteForm
          invoice={invoice}
          suggestedNumber={suggestedNumber}
        />
      </main>
    </div>
  )
}

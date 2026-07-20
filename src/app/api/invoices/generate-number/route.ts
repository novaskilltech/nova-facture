import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

const FIRST_INVOICE_NUMBER = 500

function getEntityCode(entity: { id: string; commercialName: string; legalName: string }) {
  const normalizedName = `${entity.commercialName} ${entity.legalName}`.toLowerCase()

  if (entity.id === "entity-conciergerie" || normalizedName.includes("conciergerie")) {
    return "LC"
  }

  if (entity.id === "entity-horizon-services" || normalizedName.includes("services")) {
    return "HZ"
  }

  if (entity.id === "entity-horizon" || normalizedName.includes("horizon")) {
    return "HS"
  }

  return entity.commercialName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()
}

export async function GET(request: Request) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get("entityId")

    if (!entityId) {
      return NextResponse.json({ error: "Société requise" }, { status: 400 })
    }

    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, commercialName: true, legalName: true },
    })

    if (!entity) {
      return NextResponse.json({ error: "Société introuvable" }, { status: 404 })
    }

    const entityCode = getEntityCode(entity)
    const invoices = await prisma.invoice.findMany({
      where: {
        entityId,
        number: {
          endsWith: `-${entityCode}`,
        },
      },
      select: { number: true },
    })

    const invoiceNumberPattern = new RegExp(`^inv-(\\d+)-${entityCode}$`, "i")
    const highestNumber = invoices.reduce((highest, invoice) => {
      const match = invoice.number.match(invoiceNumberPattern)
      const parsedNumber = match ? parseInt(match[1], 10) : Number.NaN
      return Number.isNaN(parsedNumber) ? highest : Math.max(highest, parsedNumber)
    }, FIRST_INVOICE_NUMBER - 1)

    const nextNumber = highestNumber + 1
    const formatted = `inv-${nextNumber}-${entityCode}`

    return NextResponse.json({ number: formatted, next: nextNumber, entityCode })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

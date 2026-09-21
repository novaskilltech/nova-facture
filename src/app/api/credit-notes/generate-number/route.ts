import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || "AV"
    const currentYear = new Date().getFullYear()

    // Recherche de tous les avoirs de l'année en cours
    const prefixYear = `${prefix}-${currentYear}-`
    const creditNotes = await prisma.creditNote.findMany({
      where: {
        number: {
          startsWith: prefixYear,
        },
      },
      select: { number: true },
    })

    const pattern = new RegExp(`^${prefix}-${currentYear}-(\\d+)$`, "i")
    let highestSequence = 0

    creditNotes.forEach((cn) => {
      const match = cn.number.match(pattern)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > highestSequence) {
          highestSequence = num
        }
      }
    })

    const nextSeq = highestSequence + 1
    const formatted = `${prefix}-${currentYear}-${String(nextSeq).padStart(4, "0")}`

    return NextResponse.json({ number: formatted, nextSeq })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        invoice: true,
        client: true,
        entity: true,
        items: true,
        refunds: {
          orderBy: { refundDate: "desc" },
        },
      },
    })

    if (!creditNote) {
      return NextResponse.json({ error: "Avoir introuvable" }, { status: 404 })
    }

    return NextResponse.json(creditNote)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


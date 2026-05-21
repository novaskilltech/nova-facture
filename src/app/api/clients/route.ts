import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const clients = await prisma.client.findMany({ orderBy: { updatedAt: "desc" } })
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const data = await request.json()
    const client = await prisma.client.create({ data })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 400 })
  }
}

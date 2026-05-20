import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAuth()
    const clients = await prisma.client.findMany({ orderBy: { updatedAt: "desc" } })
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth()
    const data = await request.json()
    const client = await prisma.client.create({ data })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
}

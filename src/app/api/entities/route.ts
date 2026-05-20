import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAuth()
    const entities = await prisma.entity.findMany({ where: { isActive: true } })
    return NextResponse.json(entities)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
}

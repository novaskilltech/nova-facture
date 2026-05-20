import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await requireAuth()
    const count = await prisma.invoice.count()
    const nextNumber = count + 1
    const formatted = `INV-${String(nextNumber).padStart(3, "0")}`
    return NextResponse.json({ number: formatted, next: nextNumber })
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
}

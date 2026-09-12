import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { processBatchGeocoding } from "@/lib/geo/geocoder"

export async function POST(request: Request) {
  try {
    await requireAuth()

    let limit = 25
    try {
      const body = await request.json()
      if (body.limit && typeof body.limit === "number") {
        limit = Math.min(50, Math.max(1, body.limit))
      }
    } catch {
      // Ignorer si pas de body
    }

    const result = await processBatchGeocoding(limit)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Non autorisé ou erreur serveur" }, { status: 500 })
  }
}


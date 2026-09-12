import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getGeoAnalytics } from "@/lib/geo/analyticsService"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all"
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const entityId = searchParams.get("entityId") || undefined
    const country = searchParams.get("country") || undefined
    const region = searchParams.get("region") || undefined
    const city = searchParams.get("city") || undefined
    const postalCode = searchParams.get("postalCode") || undefined
    const departureAirport = searchParams.get("departureAirport") || undefined
    const formulaType = searchParams.get("formulaType") || undefined
    const invoiceStatus = searchParams.get("invoiceStatus") || undefined
    const clientType = searchParams.get("clientType") || undefined

    const data = await getGeoAnalytics({
      period,
      startDate,
      endDate,
      entityId,
      country,
      region,
      city,
      postalCode,
      departureAirport,
      formulaType,
      invoiceStatus,
      clientType,
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Non autorisé ou erreur serveur" }, { status: 401 })
  }
}


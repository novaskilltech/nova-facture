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
    
    if (data.lastName) {
      const OR_conditions = []
      if (data.email && data.email.trim() !== "") {
        OR_conditions.push({ email: { equals: data.email.trim(), mode: "insensitive" } })
      }
      OR_conditions.push({
        lastName: { equals: data.lastName.trim(), mode: "insensitive" },
        firstName: data.firstName && data.firstName.trim() !== "" 
          ? { equals: data.firstName.trim(), mode: "insensitive" } 
          : null,
      })

      const existingClient = await prisma.client.findFirst({
        where: {
          OR: OR_conditions as any
        }
      })

      if (existingClient) {
        return NextResponse.json(
          { error: "Ce client (nom ou email) existe déjà dans la base de données." },
          { status: 409 }
        )
      }
    }

    const client = await prisma.client.create({ data })
    
    // Tentative d'enrichissement géographique automatique
    try {
      const { geocodeAddress, deduceRegionFromPostalCode } = await import("@/lib/geo/geocoder")
      const geo = await geocodeAddress(client)
      if (geo) {
        const deduced = deduceRegionFromPostalCode(geo.postalCode || client.postalCode)
        await prisma.client.update({
          where: { id: client.id },
          data: {
            latitude: geo.latitude,
            longitude: geo.longitude,
            city: geo.city || client.city,
            postalCode: geo.postalCode || client.postalCode,
            department: geo.department || deduced.dept || client.department,
            region: geo.region || deduced.region || client.region,
            country: geo.country || client.country || "France",
            geocodeStatus: "SUCCESS",
            geocodeError: null,
          }
        })
      } else {
        const deduced = deduceRegionFromPostalCode(client.postalCode)
        await prisma.client.update({
          where: { id: client.id },
          data: {
            region: client.region || deduced.region || null,
            department: client.department || deduced.dept || null,
            geocodeStatus: "FAILED",
            geocodeError: "Adresse introuvable ou coordonnées GPS indisponibles",
          }
        })
      }
    } catch {
      // Le géocodage échoué ne bloque pas la création du client
    }

    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 400 })
  }
}

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

  const { id } = await params

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            number: true,
            totalTTC: true,
            status: true,
            date: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    // Minimisation & Sanitize
    const updatedData = {
      lastName: body.lastName?.trim() || "",
      firstName: body.firstName?.trim() || null,
      company: body.company?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      postalCode: body.postalCode?.trim() || null,
      city: body.city?.trim() || null,
      notes: body.notes?.trim() || null,
    }

    if (!updatedData.lastName) {
      return NextResponse.json({ error: "Le nom du client est obligatoire" }, { status: 400 })
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updatedData,
      include: {
        invoices: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            number: true,
            totalTTC: true,
            status: true,
            date: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Erreur mise à jour client:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 400 })
  }
}

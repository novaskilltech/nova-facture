import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const userId = await getSession()
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const clients = await prisma.client.findMany({
      orderBy: { lastName: "asc" },
    })

    const headers = [
      "Nom",
      "Prénom",
      "Adresse",
      "Code Postal",
      "Ville",
      "Email",
      "Téléphone",
    ]

    const rows = clients.map((c) => [
      c.lastName,
      c.firstName || "",
      c.address || "",
      c.postalCode || "",
      c.city || "",
      c.email || "",
      c.phone || "",
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")),
    ].join("\n")

    return new NextResponse("\uFEFF" + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clients-export.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

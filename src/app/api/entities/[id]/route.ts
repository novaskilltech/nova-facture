import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const data = await request.json()

    const bankName = String(data.bankName || "").trim()
    const bankIban = String(data.bankIban || "").trim()
    const bankBic = String(data.bankBic || "").trim()
    const bankHolder = String(data.bankHolder || "").trim()

    if (!bankName || !bankIban || !bankBic || !bankHolder) {
      return NextResponse.json(
        { error: "Tous les champs du RIB sont obligatoires" },
        { status: 400 }
      )
    }

    const entity = await prisma.entity.update({
      where: { id },
      data: {
        bankName,
        bankIban,
        bankBic,
        bankHolder,
      },
    })

    return NextResponse.json(entity)
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la modification du RIB" },
      { status: 400 }
    )
  }
}

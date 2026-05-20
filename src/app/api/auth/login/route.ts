import { prisma } from "@/lib/db"
import { setSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import bcrypt from "bcrypt"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    await setSession(user.id)

    return response
  } catch (error) {
    console.error("Erreur login API :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}


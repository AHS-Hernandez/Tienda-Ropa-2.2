import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id_usuario: session.id_usuario,
      id_sede: session.id_sede,
      username: session.username,
      nombreCompleto: session.nombreCompleto,
      role: session.role,
      nivelAcceso: session.nivelAcceso,
    },
  })
}

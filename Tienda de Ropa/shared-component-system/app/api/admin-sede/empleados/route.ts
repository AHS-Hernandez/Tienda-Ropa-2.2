import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getDirectorioRRHH } from "@/lib/data/persona"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const empleados = await getDirectorioRRHH(session.id_sede)
    return NextResponse.json({ ok: true, empleados })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

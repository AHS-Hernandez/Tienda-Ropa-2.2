import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getMonitorVentas } from "@/lib/data/ventas"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const ventas = await getMonitorVentas({ idSede: session.id_sede })
    return NextResponse.json({ ok: true, ventas })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

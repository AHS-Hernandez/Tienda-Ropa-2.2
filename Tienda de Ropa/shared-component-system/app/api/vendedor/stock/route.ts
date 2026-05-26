import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getStockSede } from "@/lib/data/inventario"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  try {
    const stock = await getStockSede(session.id_sede)
    return NextResponse.json({ ok: true, stock })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

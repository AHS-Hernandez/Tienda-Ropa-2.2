import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import { getMonitorVentas } from "@/lib/data/ventas"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const idCliente = await resolveClienteId(session)
    const pedidos = await getMonitorVentas({ idCliente })
    return NextResponse.json({ ok: true, pedidos })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

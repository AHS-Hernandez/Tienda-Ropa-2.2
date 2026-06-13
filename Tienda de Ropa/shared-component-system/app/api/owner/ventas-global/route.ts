import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import { getRedVentasDetalleGlobal } from "@/lib/data/red-tiempo-real"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const idVenta = Number(searchParams.get("id_venta"))
  const sede = searchParams.get("sede") ?? ""

  if (!idVenta || !sede) {
    return NextResponse.json({ ok: false, message: "id_venta y sede son requeridos" }, { status: 400 })
  }

  try {
    const { rows, error } = await getRedVentasDetalleGlobal(idVenta, sede)
    if (error) return NextResponse.json({ ok: false, message: error }, { status: 500 })
    return NextResponse.json({ ok: true, detalle: sanitizeRows(rows) })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

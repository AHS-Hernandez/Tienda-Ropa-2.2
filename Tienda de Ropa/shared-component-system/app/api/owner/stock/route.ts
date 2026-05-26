import { NextResponse } from "next/server"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  getStockConsolidado,
  getAlertasStock,
  transferirStock,
} from "@/lib/data/inventario"
import { getSedesActivas } from "@/lib/data/config"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const alertas = searchParams.get("alertas") === "1"

  try {
    if (searchParams.get("sedes") === "1") {
      const sedes = await getSedesActivas()
      return NextResponse.json({ ok: true, sedes })
    }

    if (alertas) {
      const rows = await getAlertasStock()
      return NextResponse.json({ ok: true, stock: sanitizeRows(rows) })
    }
    const stock = await getStockConsolidado()
    return NextResponse.json({ ok: true, stock: sanitizeRows(stock) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    if (body.action !== "transferir") {
      return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
    }

    await transferirStock({
      idUsuario: session.id_usuario,
      idProducto: Number(body.id_producto),
      idSedeOrigen: Number(body.id_sede_origen),
      idSedeDestino: Number(body.id_sede_destino),
      cantidad: Number(body.cantidad),
    })
    return NextResponse.json({ ok: true, message: "Transferencia registrada" })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

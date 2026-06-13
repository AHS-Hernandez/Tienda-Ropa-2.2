import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import { getMonitorVentas, getProductosVenta } from "@/lib/data/ventas"
import { getResenasClienteEnVenta } from "@/lib/data/resenas"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { toPositiveInt } from "@/lib/api/parse-int"

export async function GET(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const idVenta = toPositiveInt(searchParams.get("id_venta"))

  try {
    const idCliente = await resolveClienteId(session)

    if (idVenta) {
      const [productos, resenados] = await Promise.all([
        getProductosVenta(idVenta),
        getResenasClienteEnVenta(idCliente, idVenta),
      ])
      return NextResponse.json({ ok: true, productos, resenados })
    }

    const pedidos = await getMonitorVentas({ idCliente })
    return NextResponse.json({ ok: true, pedidos })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

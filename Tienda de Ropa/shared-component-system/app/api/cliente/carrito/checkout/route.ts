import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { VENTA_BORRADOR_COOKIE } from "@/lib/cart/cookie-options"
import { getCarritoCompleto, procesarCobroVenta } from "@/lib/data/cart"
import { getVentaBorradorId } from "@/lib/cart/borrador-cookie"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function POST(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const metodoPago = String(body.metodo_pago ?? "Efectivo").trim()
    const idVenta = await getVentaBorradorId()

    if (!idVenta) {
      return NextResponse.json(
        { ok: false, message: "No hay carrito activo" },
        { status: 400 }
      )
    }

    const { lineas } = await getCarritoCompleto(idVenta)
    if (lineas.length === 0) {
      return NextResponse.json(
        { ok: false, message: "El carrito está vacío" },
        { status: 400 }
      )
    }

    await procesarCobroVenta(idVenta, metodoPago)

    const carrito = await getCarritoCompleto(idVenta)
    const res = NextResponse.json({
      ok: true,
      message: "Pago procesado",
      nro_factura: carrito.cabecera?.nro_factura,
      total_neto: carrito.cabecera?.total_neto,
    })
    res.cookies.delete(VENTA_BORRADOR_COOKIE)
    return res
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonWithVentaCookie } from "@/lib/api/json-with-cookie"
import { VENTA_BORRADOR_COOKIE } from "@/lib/cart/cookie-options"
import {
  ensureBorradorVenta,
  getCarritoCompleto,
  resolveClienteId,
  agregarProductoVenta,
  eliminarLineaVenta,
  vaciarBorrador,
} from "@/lib/data/cart"
import { getVentaBorradorId } from "@/lib/cart/borrador-cookie"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const idVenta = await getVentaBorradorId()
    if (!idVenta) {
      return NextResponse.json({ ok: true, cabecera: null, lineas: [] })
    }
    const carrito = await getCarritoCompleto(idVenta)
    if (carrito.cabecera?.estado !== "Borrador") {
      const res = NextResponse.json({ ok: true, cabecera: null, lineas: [] })
      res.cookies.delete(VENTA_BORRADOR_COOKIE)
      return res
    }
    return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const idCliente = await resolveClienteId(session)

    if (body.action === "init") {
      const idVenta = await ensureBorradorVenta(session, idCliente)
      const carrito = await getCarritoCompleto(idVenta)
      return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
    }

    if (body.action === "add") {
      const idProducto = Number(body.id_producto)
      const cantidad = Number(body.cantidad) || 1
      if (!idProducto) {
        return NextResponse.json(
          { ok: false, message: "id_producto requerido" },
          { status: 400 }
        )
      }
      const idVenta = await ensureBorradorVenta(session, idCliente)
      await agregarProductoVenta(idVenta, idProducto, cantidad)
      const carrito = await getCarritoCompleto(idVenta)
      return jsonWithVentaCookie(
        { ok: true, message: "Producto agregado al carrito", ...carrito },
        idVenta
      )
    }

    if (body.action === "clear") {
      const idVenta = await getVentaBorradorId()
      if (idVenta) await vaciarBorrador(idVenta)
      const res = NextResponse.json({ ok: true, cabecera: null, lineas: [] })
      res.cookies.delete(VENTA_BORRADOR_COOKIE)
      return res
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    const msg = getSqlErrorMessage(error)
    const hint = msg.toLowerCase().includes("stock")
      ? " Solo puede agregar productos con stock en su sede (Inventario.Stock_Actual)."
      : ""
    return NextResponse.json(
      { ok: false, message: msg + hint },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  const idDetalle = Number(new URL(request.url).searchParams.get("id_detalle"))
  if (!idDetalle) {
    return NextResponse.json(
      { ok: false, message: "id_detalle requerido" },
      { status: 400 }
    )
  }

  try {
    await eliminarLineaVenta(idDetalle)
    const idVenta = await getVentaBorradorId()
    if (!idVenta) {
      return NextResponse.json({ ok: true, cabecera: null, lineas: [] })
    }
    const carrito = await getCarritoCompleto(idVenta)
    return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

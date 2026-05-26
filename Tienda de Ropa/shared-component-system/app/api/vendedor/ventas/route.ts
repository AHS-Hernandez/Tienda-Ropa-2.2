import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonWithVentaCookie } from "@/lib/api/json-with-cookie"
import {
  ensureBorradorVenta,
  getCarritoCompleto,
  agregarProductoVenta,
  eliminarLineaVenta,
  procesarCobroVenta,
  vaciarBorrador,
} from "@/lib/data/cart"
import { getVentaBorradorId } from "@/lib/cart/borrador-cookie"
import { VENTA_BORRADOR_COOKIE } from "@/lib/cart/cookie-options"
import { crearVentaBorrador, getMonitorVentas } from "@/lib/data/ventas"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  const mode = new URL(request.url).searchParams.get("mode")

  try {
    if (mode === "hoy") {
      const ventas = await getMonitorVentas({
        idSede: session.id_sede,
        soloHoy: true,
      })
      return NextResponse.json({ ok: true, ventas })
    }

    const idVenta = await getVentaBorradorId()
    if (!idVenta) {
      return NextResponse.json({ ok: true, cabecera: null, lineas: [], id_cliente: null })
    }
    const carrito = await getCarritoCompleto(idVenta)
    return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()

    if (body.action === "nueva") {
      const idCliente = Number(body.id_cliente)
      if (!idCliente) {
        return NextResponse.json(
          { ok: false, message: "Seleccione un cliente" },
          { status: 400 }
        )
      }
      const prev = await getVentaBorradorId()
      if (prev) await vaciarBorrador(prev).catch(() => clearVentaBorradorId())

      const idVenta = await crearVentaBorrador(
        idCliente,
        session.id_usuario,
        session.id_sede
      )
      const carrito = await getCarritoCompleto(idVenta)
      return jsonWithVentaCookie(
        { ok: true, ...carrito, id_cliente: idCliente },
        idVenta
      )
    }

    if (body.action === "add") {
      const idCliente = Number(body.id_cliente)
      const idProducto = Number(body.id_producto)
      const cantidad = Number(body.cantidad) || 1
      const idVenta = await ensureBorradorVenta(session, idCliente)
      await agregarProductoVenta(idVenta, idProducto, cantidad)
      const carrito = await getCarritoCompleto(idVenta)
      return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
    }

    if (body.action === "cobrar") {
      const idVenta = await getVentaBorradorId()
      if (!idVenta) {
        return NextResponse.json({ ok: false, message: "Sin venta activa" }, { status: 400 })
      }
      await procesarCobroVenta(idVenta, String(body.metodo_pago ?? "Efectivo"))
      const carrito = await getCarritoCompleto(idVenta)
      const res = NextResponse.json({
        ok: true,
        message: "Cobro registrado",
        nro_factura: carrito.cabecera?.nro_factura,
        total_neto: carrito.cabecera?.total_neto,
      })
      res.cookies.delete(VENTA_BORRADOR_COOKIE)
      return res
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    const msg = getSqlErrorMessage(error)
    const hint = msg.toLowerCase().includes("stock")
      ? " Solo productos con stock en su sede."
      : ""
    return NextResponse.json(
      { ok: false, message: msg + hint },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  const idDetalle = Number(new URL(request.url).searchParams.get("id_detalle"))
  if (!idDetalle) {
    return NextResponse.json({ ok: false, message: "id_detalle requerido" }, { status: 400 })
  }

  try {
    await eliminarLineaVenta(idDetalle)
    const idVenta = await getVentaBorradorId()
    if (!idVenta) return NextResponse.json({ ok: true, cabecera: null, lineas: [] })
    const carrito = await getCarritoCompleto(idVenta)
    return jsonWithVentaCookie({ ok: true, ...carrito }, idVenta)
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

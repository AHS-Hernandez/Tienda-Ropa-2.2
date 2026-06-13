import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  normalizeCompraRow,
  normalizeProveedorRow,
} from "@/lib/api/compras-rows"
import { jsonData } from "@/lib/api/json-response"
import { getComprasTotalesSafe, getProveedores } from "@/lib/data/admin"
import { buscarProductosCompra } from "@/lib/data/producto"
import {
  registrarProveedor,
  modificarProveedor,
  emitirOrdenCompra,
  anularOrdenCompra,
  consolidarRecepcion,
} from "@/lib/data/compras"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["admin-global"])
    if (sessionIsResponse(session)) return session

    const { searchParams } = new URL(request.url)

    if (searchParams.get("productos") === "1") {
      const q = searchParams.get("q")?.trim() ?? ""
      const soloPromo = searchParams.get("promo") === "1"
      if (!q && !soloPromo) {
        return jsonData({ ok: true, productos: [] })
      }
      const productos = await buscarProductosCompra(q, 50, { soloPromocion: soloPromo })
      return jsonData({ ok: true, productos })
    }

    let compras: Record<string, unknown>[] = []
    let proveedores: Record<string, unknown>[] = []

    try {
      compras = await getComprasTotalesSafe()
    } catch (e) {
      console.error("[compras GET compras]", e)
    }

    try {
      proveedores = await getProveedores()
    } catch (e) {
      console.error("[compras GET proveedores]", e)
    }

    return jsonData({
      ok: true,
      compras: compras.map(normalizeCompraRow),
      proveedores: proveedores.map(normalizeProveedorRow),
    })
  } catch (error) {
    console.error("[compras GET]", error)
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(["admin-global"])
    if (sessionIsResponse(session)) return session

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { ok: false, message: "Cuerpo JSON inválido" },
        { status: 400 }
      )
    }

    if (body.action === "proveedor") {
      await registrarProveedor({
        razonSocial: String(body.razon_social ?? ""),
        nit: String(body.nit ?? ""),
        contacto: String(body.contacto ?? ""),
        telefono: String(body.telefono ?? ""),
        email: String(body.email ?? ""),
        direccion: String(body.direccion ?? ""),
      })
      return NextResponse.json({ ok: true, message: "Proveedor registrado" })
    }

    if (body.action === "proveedor_editar") {
      await modificarProveedor({
        idProveedor: Number(body.id_proveedor),
        razonSocial: body.razon_social != null ? String(body.razon_social) : undefined,
        contacto: body.contacto != null ? String(body.contacto) : undefined,
        telefono: body.telefono != null ? String(body.telefono) : undefined,
        email: body.email != null ? String(body.email) : undefined,
        direccion: body.direccion != null ? String(body.direccion) : undefined,
      })
      return NextResponse.json({ ok: true })
    }

    if (body.action === "orden") {
      const detalles = body.detalles as
        | { id_producto: number; cantidad: number; costo: number }[]
        | undefined
      if (!Array.isArray(detalles) || detalles.length === 0) {
        return NextResponse.json(
          { ok: false, message: "Detalle de orden requerido" },
          { status: 400 }
        )
      }
      await emitirOrdenCompra(
        Number(body.id_proveedor),
        Number(body.total_compra),
        detalles
      )
      return NextResponse.json({ ok: true, message: "Orden emitida" })
    }

    if (body.action === "anular") {
      await anularOrdenCompra(Number(body.id_compra))
      return NextResponse.json({ ok: true, message: "Orden anulada" })
    }

    if (body.action === "recibir") {
      await consolidarRecepcion(Number(body.id_compra))
      return NextResponse.json({ ok: true, message: "Mercadería recibida" })
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[compras POST]", error)
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

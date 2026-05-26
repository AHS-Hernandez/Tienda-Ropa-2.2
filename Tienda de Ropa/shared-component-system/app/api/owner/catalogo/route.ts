import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getCatalogoProductos } from "@/lib/data/catalogo"
import {
  registrarProducto,
  modificarFichaProducto,
  actualizarPrecios,
  getSubcategorias,
} from "@/lib/data/producto"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  const busqueda = new URL(request.url).searchParams.get("q") ?? undefined

  try {
    const productos = await getCatalogoProductos(session.id_sede, {
      busqueda,
      incluirCosto: true,
    })
    return NextResponse.json({ ok: true, productos })
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

    if (body.action === "subcategorias") {
      const subcategorias = await getSubcategorias()
      return NextResponse.json({ ok: true, subcategorias })
    }

    if (body.action === "crear") {
      await registrarProducto({
        idSubcategoria: Number(body.id_subcategoria),
        nombre: body.nombre,
        descripcion: body.descripcion ?? "",
        marca: body.marca ?? "",
        color: body.color ?? "",
        talla: body.talla ?? "",
        precioCosto: Number(body.precio_costo),
        precioVenta: Number(body.precio_venta),
      })
      return NextResponse.json({ ok: true })
    }

    if (body.action === "ficha") {
      await modificarFichaProducto({
        idProducto: Number(body.id_producto),
        nombre: body.nombre,
        descripcion: body.descripcion,
        marca: body.marca,
        color: body.color,
        talla: body.talla,
      })
      return NextResponse.json({ ok: true })
    }

    if (body.action === "precios") {
      await actualizarPrecios({
        idProducto: Number(body.id_producto),
        precioCosto: Number(body.precio_costo),
        precioVenta: Number(body.precio_venta),
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

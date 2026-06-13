import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getCatalogoProductos } from "@/lib/data/catalogo"
import {
  registrarProducto,
  modificarFichaProducto,
  actualizarPrecios,
  getSubcategorias,
  getCategoriasList,
  agregarCategoria,
  agregarSubcategoria,
  modificarCategoria,
  modificarSubcategoria,
} from "@/lib/data/producto"
import { getSqlErrorMessage } from "@/lib/db/errors"

function replicationHint(message: string): string {
  if (/timeout|linked|7416|SEDE|distributed/i.test(message)) {
    return `${message} — Si tarda mucho, verifique linked server SEDE o ejecute el alta directo en SSMS.`
  }
  return message
}

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

  const actor = session.id_usuario

  try {
    const body = await request.json()

    if (body.action === "subcategorias") {
      const subcategorias = await getSubcategorias()
      return NextResponse.json({ ok: true, subcategorias })
    }

    if (body.action === "categorias") {
      const categorias = await getCategoriasList()
      return NextResponse.json({ ok: true, categorias })
    }

    if (body.action === "crear_categoria") {
      await agregarCategoria(actor, String(body.nombre ?? "").trim())
      const categorias = await getCategoriasList()
      return NextResponse.json({ ok: true, categorias })
    }

    if (body.action === "crear_subcategoria") {
      await agregarSubcategoria(
        actor,
        Number(body.id_categoria),
        String(body.nombre ?? "").trim()
      )
      const [categorias, subcategorias] = await Promise.all([
        getCategoriasList(),
        getSubcategorias(),
      ])
      return NextResponse.json({ ok: true, categorias, subcategorias })
    }

    if (body.action === "editar_categoria") {
      await modificarCategoria(
        actor,
        Number(body.id_categoria),
        String(body.nombre ?? "").trim()
      )
      const categorias = await getCategoriasList()
      return NextResponse.json({ ok: true, categorias })
    }

    if (body.action === "editar_subcategoria") {
      await modificarSubcategoria(
        actor,
        Number(body.id_subcategoria),
        String(body.nombre ?? "").trim(),
        body.id_categoria != null ? Number(body.id_categoria) : undefined
      )
      const [categorias, subcategorias] = await Promise.all([
        getCategoriasList(),
        getSubcategorias(),
      ])
      return NextResponse.json({ ok: true, categorias, subcategorias })
    }

    if (body.action === "crear") {
      await registrarProducto(actor, {
        idSubcategoria: Number(body.id_subcategoria),
        nombre: String(body.nombre ?? ""),
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
      { ok: false, message: replicationHint(getSqlErrorMessage(error)) },
      { status: 400 }
    )
  }
}

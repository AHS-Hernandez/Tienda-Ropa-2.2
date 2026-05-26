import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  listPromocionesCabecera,
  listPromociones,
  listCategoriasAlcance,
  listSubcategoriasAlcance,
  listProductosAlcance,
  registrarCampana,
  modificarCampana,
  finalizarCampana,
  asignarAlcance,
  limpiarAlcances,
} from "@/lib/data/marketing"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const [cabeceras, detalle, categorias, subcategorias, productos] =
      await Promise.all([
        listPromocionesCabecera(),
        listPromociones(),
        listCategoriasAlcance(),
        listSubcategoriasAlcance(),
        listProductosAlcance(),
      ])
    return NextResponse.json({
      ok: true,
      promociones: cabeceras,
      alcances: detalle,
      categorias,
      subcategorias,
      productos,
    })
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
    const id = await registrarCampana({
      nombre: body.nombre,
      porcentaje: body.tipo === "porcentaje" ? Number(body.valor) : null,
      monto: body.tipo === "monto" ? Number(body.valor) : null,
      fechaInicio: body.fecha_inicio,
      fechaFin: body.fecha_fin,
    })

    const tieneAlcance =
      body.id_producto || body.id_categoria || body.id_subcategoria
    if (!tieneAlcance) {
      throw new Error(
        "Debe asignar alcance: producto, categoría o subcategoría (sp_Asignar_Alcance_Promocion)."
      )
    }

    await asignarAlcance({
      idPromocion: id,
      idProducto: body.id_producto ? Number(body.id_producto) : null,
      idCategoria: body.id_categoria ? Number(body.id_categoria) : null,
      idSubcategoria: body.id_subcategoria ? Number(body.id_subcategoria) : null,
      montoMinimo: body.monto_minimo ?? 0,
    })

    return NextResponse.json({ ok: true, id_promocion: id })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const id = Number(body.id_promocion)
    if (!id) throw new Error("id_promocion requerido")

    await modificarCampana({
      idPromocion: id,
      nombre: body.nombre,
      porcentaje: body.tipo === "porcentaje" ? Number(body.valor) : null,
      monto: body.tipo === "monto" ? Number(body.valor) : null,
      fechaInicio: body.fecha_inicio,
      fechaFin: body.fecha_fin,
    })

    if (body.reasignar_alcance) {
      await limpiarAlcances(id)
      const tiene =
        body.id_producto || body.id_categoria || body.id_subcategoria
      if (tiene) {
        await asignarAlcance({
          idPromocion: id,
          idProducto: body.id_producto ? Number(body.id_producto) : null,
          idCategoria: body.id_categoria ? Number(body.id_categoria) : null,
          idSubcategoria: body.id_subcategoria ? Number(body.id_subcategoria) : null,
          montoMinimo: body.monto_minimo ?? 0,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!id) throw new Error("id requerido")
    await finalizarCampana(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

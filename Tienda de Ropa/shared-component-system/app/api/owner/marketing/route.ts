import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { toPositiveInt } from "@/lib/api/parse-int"
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

function parseAlcance(body: Record<string, unknown>) {
  return {
    idProducto: toPositiveInt(body.id_producto),
    idCategoria: toPositiveInt(body.id_categoria),
    idSubcategoria: toPositiveInt(body.id_subcategoria),
    montoMinimo: Number(body.monto_minimo) || 0,
  }
}

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
    const alcance = parseAlcance(body)

    if (!alcance.idProducto && !alcance.idCategoria && !alcance.idSubcategoria) {
      throw new Error(
        "Debe asignar alcance: producto, categoría o subcategoría (sp_Asignar_Alcance_Promocion)."
      )
    }

    const id = await registrarCampana({
      nombre: body.nombre,
      porcentaje: body.tipo === "porcentaje" ? Number(body.valor) : null,
      monto: body.tipo === "monto" ? Number(body.valor) : null,
      fechaInicio: body.fecha_inicio,
      fechaFin: body.fecha_fin,
    })

    await asignarAlcance({
      idPromocion: id,
      ...alcance,
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
      const alcance = parseAlcance(body)
      await limpiarAlcances(id)
      if (alcance.idProducto || alcance.idCategoria || alcance.idSubcategoria) {
        await asignarAlcance({ idPromocion: id, ...alcance })
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

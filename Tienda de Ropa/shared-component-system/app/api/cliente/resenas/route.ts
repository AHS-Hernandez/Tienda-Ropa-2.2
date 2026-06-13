import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import {
  getResenasPublicadas,
  getResumenResenas,
  clienteYaReseno,
  validarCompraSQL,
  insertarResena,
  editarResena,
  eliminarResena,
  getVentaCompradaProducto,
  getMiResenaProducto,
  type ResenaMia,
} from "@/lib/data/resenas"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { toPositiveInt } from "@/lib/api/parse-int"
import { getNombresClientes } from "@/lib/data/personas"

const ROLES_ADMIN = new Set(["admin-sede", "admin-global"])

export async function GET(request: Request) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session
  const esAdmin = ROLES_ADMIN.has(session.role)

  const { searchParams } = new URL(request.url)
  const idProducto = toPositiveInt(searchParams.get("id_producto"))
  if (!idProducto) {
    return NextResponse.json({ ok: false, message: "id_producto requerido" }, { status: 400 })
  }

  try {
    // Admin ve TODAS las reseñas (incluidas las ocultas) para poder gestionarlas.
    // Cliente solo las publicadas.
    const { getTodasResenas } = await import("@/lib/data/resenas")
    const [resenas, resumen] = await Promise.all([
      esAdmin ? getTodasResenas(idProducto) : getResenasPublicadas(idProducto),
      getResumenResenas(idProducto),
    ])
    const ids = [...new Set(resenas.map((r) => r.id_cliente))]
    const nombres = await getNombresClientes(ids)

    // Cliente actual (si esta logueado) para marcar su voto propio en cada resena
    let idClienteActual: number | null = null
    try {
      idClienteActual = await resolveClienteId(session)
    } catch {
      // sin cliente resuelto, voto_propio = null en todas
    }

    const resenasEnriquecidas = resenas.map((r) => {
      const propio = idClienteActual
        ? (r.votos ?? []).find((v) => v.id_cliente === idClienteActual)?.voto ?? null
        : null
      // Admin ve todas las respuestas (incluso ocultas). Cliente solo publicadas.
      const respuestasVisibles = (r.respuestas ?? [])
        .filter((resp) => esAdmin || resp.estado === "publicada")
        .map((resp) => {
          const propioResp = (resp.votos ?? []).find(
            (v) => v.id_usuario === session.id_usuario
          )?.voto ?? null
          return {
            ...resp,
            _id: resp._id.toString(),
            es_mia: resp.id_usuario === session.id_usuario,
            likes: resp.likes ?? 0,
            dislikes: resp.dislikes ?? 0,
            voto_propio: propioResp,
            votos: undefined,
          }
        })
      return {
        ...r,
        nombre_cliente: nombres[r.id_cliente] ?? `Cliente #${r.id_cliente}`,
        likes: r.likes ?? 0,
        dislikes: r.dislikes ?? 0,
        voto_propio: propio,
        respuestas: respuestasVisibles,
        votos: undefined,
      }
    })

    // Elegibilidad del cliente actual para reseñar este producto
    let elegibilidad: { compro: boolean; id_venta: number | null; mi_resena: ResenaMia | null } = {
      compro: false,
      id_venta: null,
      mi_resena: null,
    }
    if (idClienteActual !== null) {
      const [idVenta, miResena] = await Promise.all([
        getVentaCompradaProducto(idClienteActual, idProducto),
        getMiResenaProducto(idClienteActual, idProducto),
      ])
      elegibilidad = { compro: idVenta !== null, id_venta: idVenta, mi_resena: miResena }
    }

    return NextResponse.json({
      ok: true,
      resenas: resenasEnriquecidas,
      resumen,
      elegibilidad,
      es_admin: esAdmin,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const idProducto = Number(body.id_producto)
    let idVenta = Number(body.id_venta) || 0
    const rating = Number(body.rating)
    const titulo = String(body.titulo ?? "").trim()
    const texto = String(body.texto ?? "").trim()

    if (!idProducto || !rating || !titulo || !texto) {
      return NextResponse.json({ ok: false, message: "Datos incompletos" }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, message: "Rating debe ser entre 1 y 5" }, { status: 400 })
    }

    const idCliente = await resolveClienteId(session)

    // Reseña directa desde la ficha del producto: no llega id_venta, lo resolvemos
    if (!idVenta) {
      const resuelto = await getVentaCompradaProducto(idCliente, idProducto)
      if (!resuelto) {
        return NextResponse.json(
          { ok: false, message: "Solo puedes reseñar productos que hayas comprado" },
          { status: 403 }
        )
      }
      idVenta = resuelto
    }

    const [compro, yaReseno] = await Promise.all([
      validarCompraSQL(idCliente, idProducto, idVenta),
      clienteYaReseno(idCliente, idProducto, idVenta),
    ])

    if (!compro) {
      return NextResponse.json(
        { ok: false, message: "No puedes reseñar un producto que no compraste" },
        { status: 403 }
      )
    }
    if (yaReseno) {
      return NextResponse.json(
        { ok: false, message: "Ya enviaste una reseña para este producto en esta compra" },
        { status: 409 }
      )
    }

    await insertarResena({
      id_producto: idProducto,
      id_cliente: idCliente,
      id_venta: idVenta,
      id_sede: session.id_sede,
      rating,
      titulo,
      texto,
      estado: "publicada",
      fecha: new Date(),
    })

    return NextResponse.json({ ok: true, message: "Reseña publicada" })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const id = String(body._id ?? "").trim()
    const rating = Number(body.rating)
    const titulo = String(body.titulo ?? "").trim()
    const texto = String(body.texto ?? "").trim()

    if (!id || !rating || !titulo || !texto) {
      return NextResponse.json({ ok: false, message: "Datos incompletos" }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, message: "Rating debe ser entre 1 y 5" }, { status: 400 })
    }

    const idCliente = await resolveClienteId(session)
    const actualizado = await editarResena(id, idCliente, { rating, titulo, texto })

    if (!actualizado) {
      return NextResponse.json({ ok: false, message: "Reseña no encontrada o no es tuya" }, { status: 403 })
    }

    return NextResponse.json({ ok: true, message: "Reseña actualizada" })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const { _id } = await request.json()
    const id = String(_id ?? "").trim()
    if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })

    const idCliente = await resolveClienteId(session)
    const db = (await import("@/lib/db/mongo")).getMongoDB
    const { ObjectId } = await import("mongodb")
    const mongo = await db()
    const doc = await mongo.collection("resenas").findOne({ _id: new ObjectId(id) })

    if (!doc || doc.id_cliente !== idCliente) {
      return NextResponse.json({ ok: false, message: "Reseña no encontrada o no es tuya" }, { status: 403 })
    }

    await eliminarResena(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

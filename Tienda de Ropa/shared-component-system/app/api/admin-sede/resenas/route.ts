import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getTodasResenas, cambiarEstadoResena, eliminarResena } from "@/lib/data/resenas"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { toPositiveInt } from "@/lib/api/parse-int"
import { getNombresClientes } from "@/lib/data/personas"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const idProducto = toPositiveInt(searchParams.get("id_producto"))
  if (!idProducto) {
    return NextResponse.json({ ok: false, message: "id_producto requerido" }, { status: 400 })
  }

  try {
    const resenas = await getTodasResenas(idProducto)
    const ids = [...new Set(resenas.map((r) => r.id_cliente))]
    const nombres = await getNombresClientes(ids)
    const resenasEnriquecidas = resenas.map((r) => ({
      ...r,
      _id: r._id?.toString?.() ?? String(r._id),
      nombre_cliente: nombres[r.id_cliente] ?? `Cliente #${r.id_cliente}`,
      respuestas: (r.respuestas ?? []).map((resp) => ({
        ...resp,
        _id: resp._id.toString(),
      })),
    }))
    return NextResponse.json({ ok: true, resenas: resenasEnriquecidas })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const id = String(body._id ?? "").trim()
    const estado = body.estado as "publicada" | "oculta"

    if (!id || !["publicada", "oculta"].includes(estado)) {
      return NextResponse.json({ ok: false, message: "Datos inválidos" }, { status: 400 })
    }

    await cambiarEstadoResena(id, estado)
    return NextResponse.json({ ok: true, message: `Reseña ${estado}` })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const { _id } = await request.json()
    const id = String(_id ?? "").trim()
    if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })
    await eliminarResena(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

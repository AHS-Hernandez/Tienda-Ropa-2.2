import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  getTodasResenasGlobal,
  cambiarEstadoResena,
  eliminarResena,
} from "@/lib/data/resenas"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { toPositiveInt } from "@/lib/api/parse-int"
import { getNombresClientes, getNombresProductos } from "@/lib/data/personas"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const idProducto = toPositiveInt(searchParams.get("id_producto"))
  const estado = searchParams.get("estado") as "publicada" | "oculta" | null

  try {
    const resenas = await getTodasResenasGlobal({
      ...(idProducto ? { id_producto: idProducto } : {}),
      ...(estado ? { estado } : {}),
    })
    const idsClientes = [...new Set(resenas.map((r) => r.id_cliente))]
    const idsProductos = [...new Set(resenas.map((r) => r.id_producto))]
    const [nombres, nombresProductos] = await Promise.all([
      getNombresClientes(idsClientes),
      getNombresProductos(idsProductos),
    ])
    const resenasEnriquecidas = resenas.map((r) => ({
      ...r,
      nombre_cliente: nombres[r.id_cliente] ?? `Cliente #${r.id_cliente}`,
      nombre_producto: nombresProductos[r.id_producto] ?? null,
    }))
    return NextResponse.json({ ok: true, resenas: resenasEnriquecidas })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const id = String(body._id ?? "").trim()
    const estado = body.estado as "publicada" | "oculta"
    if (!id || !["publicada", "oculta"].includes(estado)) {
      return NextResponse.json({ ok: false, message: "Datos inválidos" }, { status: 400 })
    }
    await cambiarEstadoResena(id, estado)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await requireApiSession(["admin-global"])
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

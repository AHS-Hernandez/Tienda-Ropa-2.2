import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getResenasPublicadas, getResumenResenas } from "@/lib/data/resenas"
import { getSqlErrorMessage } from "@/lib/db/errors"
import { toPositiveInt } from "@/lib/api/parse-int"
import { getNombresClientes } from "@/lib/data/personas"

export async function GET(request: Request) {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const idProducto = toPositiveInt(searchParams.get("id_producto"))
  if (!idProducto) {
    return NextResponse.json({ ok: false, message: "id_producto requerido" }, { status: 400 })
  }

  try {
    const [resenas, resumen] = await Promise.all([
      getResenasPublicadas(idProducto),
      getResumenResenas(idProducto),
    ])
    const ids = [...new Set(resenas.map((r) => r.id_cliente))]
    const nombres = await getNombresClientes(ids)
    const resenasEnriquecidas = resenas.map((r) => ({
      ...r,
      nombre_cliente: nombres[r.id_cliente] ?? `Cliente #${r.id_cliente}`,
    }))
    return NextResponse.json({ ok: true, resenas: resenasEnriquecidas, resumen })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

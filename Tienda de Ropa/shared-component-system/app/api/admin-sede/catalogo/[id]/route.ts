import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getProductoById } from "@/lib/data/catalogo"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  const { id } = await params
  const idProducto = Number(id)
  if (!idProducto) {
    return NextResponse.json({ ok: false, message: "id inválido" }, { status: 400 })
  }

  try {
    const producto = await getProductoById(idProducto, session.id_sede)
    if (!producto) {
      return NextResponse.json({ ok: false, message: "Producto no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, producto })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

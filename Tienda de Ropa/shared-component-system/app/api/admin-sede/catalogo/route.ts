import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getCatalogoProductos, getCategorias } from "@/lib/data/catalogo"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get("categoria") ?? undefined
  const busqueda = searchParams.get("q") ?? undefined
  const listCategorias = searchParams.get("categorias") === "1"

  try {
    if (listCategorias) {
      const categorias = await getCategorias()
      return NextResponse.json({ ok: true, categorias })
    }

    const productos = await getCatalogoProductos(session.id_sede, { categoria, busqueda })
    return NextResponse.json({ ok: true, productos })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

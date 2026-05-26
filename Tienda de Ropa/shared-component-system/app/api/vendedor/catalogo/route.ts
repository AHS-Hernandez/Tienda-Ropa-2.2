import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getCatalogoProductos } from "@/lib/data/catalogo"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const session = await requireApiSession(["vendedor"])
  if (sessionIsResponse(session)) return session

  const busqueda = new URL(request.url).searchParams.get("q") ?? undefined

  try {
    const productos = await getCatalogoProductos(session.id_sede, { busqueda })
    return NextResponse.json({ ok: true, productos })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

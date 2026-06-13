import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import { insertarEvento, invalidarFeed, type TipoEvento } from "@/lib/data/eventos"
import { getSqlErrorMessage } from "@/lib/db/errors"

const TIPOS_VALIDOS: TipoEvento[] = [
  "vista_producto",
  "busqueda",
  "agregar_carrito",
  "abandono",
]

export async function POST(request: Request) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const tipo = body.tipo as TipoEvento

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ ok: false, message: "Tipo de evento inválido" }, { status: 400 })
    }

    const idCliente = await resolveClienteId(session)

    await insertarEvento({
      id_cliente: idCliente,
      tipo,
      id_producto: body.id_producto ? Number(body.id_producto) : undefined,
      id_categoria: body.id_categoria ? Number(body.id_categoria) : undefined,
      termino_busqueda: body.termino_busqueda ? String(body.termino_busqueda) : undefined,
      session_id: String(body.session_id ?? ""),
      id_sede: session.id_sede,
      meta: body.meta ?? undefined,
    })

    await invalidarFeed(idCliente)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

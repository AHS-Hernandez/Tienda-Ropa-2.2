import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import { getFeedCliente, generarFeedCliente } from "@/lib/data/feed"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  try {
    const idCliente = await resolveClienteId(session)

    let feed = await getFeedCliente(idCliente)
    if (!feed) {
      feed = await generarFeedCliente(idCliente, session.id_sede)
    }

    return NextResponse.json({ ok: true, recomendaciones: feed.recomendaciones })
  } catch (error) {
    console.error("[api/cliente/feed]", error)
    return NextResponse.json({ ok: false, message: getSqlErrorMessage(error) }, { status: 500 })
  }
}

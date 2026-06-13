import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { resolveClienteId } from "@/lib/data/cart"
import { votarResena } from "@/lib/data/resenas"

/**
 * Toggle del voto del cliente autenticado sobre una resena.
 * Body: { voto: 'like' | 'dislike' }
 * Respuesta: { ok, likes, dislikes, voto_propio }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession(["cliente"])
  if (sessionIsResponse(session)) return session

  const { id } = await params
  if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })

  try {
    const { voto } = await request.json()
    if (voto !== "like" && voto !== "dislike") {
      return NextResponse.json({ ok: false, message: "voto debe ser like o dislike" }, { status: 400 })
    }

    const idCliente = await resolveClienteId(session)
    const resultado = await votarResena(id, idCliente, session.id_sede, voto)
    if (!resultado) {
      return NextResponse.json({ ok: false, message: "Resena no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, ...resultado })
  } catch (e) {
    console.error("[api/cliente/resenas/[id]/voto]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error al votar" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { votarRespuesta } from "@/lib/data/resenas"

/**
 * Toggle de voto sobre una respuesta. Cualquier rol autenticado puede votar.
 * Body: { voto: 'like' | 'dislike' }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; idRespuesta: string }> }
) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  const { id, idRespuesta } = await params
  if (!id || !idRespuesta) {
    return NextResponse.json({ ok: false, message: "ids requeridos" }, { status: 400 })
  }

  try {
    const { voto } = await request.json()
    if (voto !== "like" && voto !== "dislike") {
      return NextResponse.json(
        { ok: false, message: "voto debe ser like o dislike" },
        { status: 400 }
      )
    }

    const resultado = await votarRespuesta(
      id,
      idRespuesta,
      session.id_usuario,
      session.id_sede,
      voto
    )
    if (!resultado) {
      return NextResponse.json(
        { ok: false, message: "Respuesta no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, ...resultado })
  } catch (e) {
    console.error("[voto respuesta]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

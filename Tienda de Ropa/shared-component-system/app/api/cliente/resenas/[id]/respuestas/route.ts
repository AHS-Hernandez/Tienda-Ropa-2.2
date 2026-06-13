import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { agregarRespuesta } from "@/lib/data/resenas"

/**
 * Crear respuesta a una resena.
 * Cualquier rol autenticado puede responder.
 * Body: { texto: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  const { id } = await params
  if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })

  try {
    const { texto } = await request.json()
    const limpio = String(texto ?? "").trim()
    if (!limpio) {
      return NextResponse.json({ ok: false, message: "Texto requerido" }, { status: 400 })
    }
    if (limpio.length > 1000) {
      return NextResponse.json({ ok: false, message: "Maximo 1000 caracteres" }, { status: 400 })
    }

    const respuesta = await agregarRespuesta(
      id,
      {
        id_usuario: session.id_usuario,
        id_sede: session.id_sede,
        nombre: session.nombreCompleto,
        rol: session.role,
      },
      limpio
    )

    if (!respuesta) {
      return NextResponse.json({ ok: false, message: "Resena no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      respuesta: {
        ...respuesta,
        _id: respuesta._id.toString(),
      },
    })
  } catch (e) {
    console.error("[api/cliente/resenas/[id]/respuestas]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

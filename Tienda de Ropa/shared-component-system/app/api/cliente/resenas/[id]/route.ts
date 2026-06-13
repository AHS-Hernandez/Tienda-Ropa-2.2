import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { cambiarEstadoResena, eliminarResena } from "@/lib/data/resenas"

const ROLES_ADMIN = new Set(["admin-sede", "admin-global"])

/**
 * PATCH: admin oculta o vuelve a publicar una resena.
 * Body: { estado: 'oculta' | 'publicada' }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  if (!ROLES_ADMIN.has(session.role)) {
    return NextResponse.json(
      { ok: false, message: "Solo administradores pueden cambiar el estado de una reseña" },
      { status: 403 }
    )
  }

  const { id } = await params
  if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })

  try {
    const { estado } = await request.json()
    if (estado !== "publicada" && estado !== "oculta") {
      return NextResponse.json(
        { ok: false, message: "estado debe ser publicada u oculta" },
        { status: 400 }
      )
    }
    await cambiarEstadoResena(id, estado)
    return NextResponse.json({ ok: true, estado })
  } catch (e) {
    console.error("[resena PATCH]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE: admin elimina una resena completa (con sus respuestas).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  if (!ROLES_ADMIN.has(session.role)) {
    return NextResponse.json(
      { ok: false, message: "Solo administradores pueden eliminar una reseña" },
      { status: 403 }
    )
  }

  const { id } = await params
  if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 })

  try {
    await eliminarResena(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[resena DELETE]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

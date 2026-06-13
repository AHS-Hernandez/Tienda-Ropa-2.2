import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import {
  editarRespuesta,
  eliminarRespuesta,
  cambiarEstadoRespuesta,
} from "@/lib/data/resenas"

const ROLES_ADMIN = new Set(["admin-sede", "admin-global"])

/**
 * PATCH: editar texto (solo autor) o cambiar estado (solo admin).
 *   Body: { texto?: string }  -> autor edita su texto
 *   Body: { estado: 'publicada'|'oculta' } -> admin oculta/muestra
 */
export async function PATCH(
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
    const body = await request.json()

    // Cambio de estado -> solo admin
    if (body.estado === "publicada" || body.estado === "oculta") {
      if (!ROLES_ADMIN.has(session.role)) {
        return NextResponse.json(
          { ok: false, message: "Solo administradores pueden cambiar el estado" },
          { status: 403 }
        )
      }
      const ok = await cambiarEstadoRespuesta(id, idRespuesta, body.estado)
      if (!ok) {
        return NextResponse.json({ ok: false, message: "Respuesta no encontrada" }, { status: 404 })
      }
      return NextResponse.json({ ok: true, estado: body.estado })
    }

    // Edicion de texto -> solo autor
    if (typeof body.texto === "string") {
      const limpio = body.texto.trim()
      if (!limpio) {
        return NextResponse.json({ ok: false, message: "Texto requerido" }, { status: 400 })
      }
      if (limpio.length > 1000) {
        return NextResponse.json({ ok: false, message: "Maximo 1000 caracteres" }, { status: 400 })
      }
      const ok = await editarRespuesta(id, idRespuesta, session.id_usuario, limpio)
      if (!ok) {
        return NextResponse.json(
          { ok: false, message: "No puedes editar esta respuesta" },
          { status: 403 }
        )
      }
      return NextResponse.json({ ok: true, texto: limpio, editada: true })
    }

    return NextResponse.json({ ok: false, message: "Accion no reconocida" }, { status: 400 })
  } catch (e) {
    console.error("[api/cliente/resenas/[id]/respuestas/[idRespuesta] PATCH]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE: borrar respuesta.
 *   - Autor original puede borrar la suya.
 *   - Admin (sede o global) puede borrar cualquiera.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; idRespuesta: string }> }
) {
  const session = await requireApiSession()
  if (sessionIsResponse(session)) return session

  const { id, idRespuesta } = await params
  if (!id || !idRespuesta) {
    return NextResponse.json({ ok: false, message: "ids requeridos" }, { status: 400 })
  }

  try {
    const esAdmin = ROLES_ADMIN.has(session.role)
    const ok = await eliminarRespuesta(id, idRespuesta, session.id_usuario, esAdmin)
    if (!ok) {
      return NextResponse.json(
        { ok: false, message: "No puedes eliminar esta respuesta" },
        { status: 403 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/cliente/resenas/[id]/respuestas/[idRespuesta] DELETE]", e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    )
  }
}

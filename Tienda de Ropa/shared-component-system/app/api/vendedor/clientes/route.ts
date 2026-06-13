import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonData } from "@/lib/api/json-response"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import {
  buscarClientesSede,
  getClienteDetalle,
  getDirectorioClientes,
  modificarCliente,
  registrarClienteCompleto,
} from "@/lib/data/persona"
import {
  activarUsuarioClienteExistente,
  buscarPersonaPorEmail,
} from "@/lib/data/registro"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(["vendedor"])
    if (sessionIsResponse(session)) return session

    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get("id")

    if (idParam) {
      const detalle = await getClienteDetalle(
        Number(idParam),
        session.id_sede
      )
      if (!detalle) {
        return NextResponse.json(
          { ok: false, message: "Cliente no encontrado en su sede" },
          { status: 404 }
        )
      }
      return jsonData({ ok: true, cliente: sanitizeRows([detalle])[0] })
    }

    const q = searchParams.get("q")?.trim()
    const emailLookup = searchParams.get("email")?.trim()

    if (emailLookup) {
      const persona = await buscarPersonaPorEmail(emailLookup, session.id_sede)
      return jsonData({
        ok: true,
        persona: persona ? sanitizeRows([persona])[0] : null,
      })
    }

    if (q && q.length > 0) {
      const clientes = await buscarClientesSede(q, session.id_sede)
      return jsonData({ ok: true, clientes: sanitizeRows(clientes) })
    }

    const clientes = await getDirectorioClientes(session.id_sede)
    return jsonData({ ok: true, clientes: sanitizeRows(clientes) })
  } catch (error) {
    console.error("[vendedor/clientes GET]", error)
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(["vendedor"])
    if (sessionIsResponse(session)) return session

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { ok: false, message: "Cuerpo JSON inválido" },
        { status: 400 }
      )
    }

    if (body.action === "activar_cuenta") {
      const email = String(body.email ?? "").trim().toLowerCase()
      const password = String(body.password ?? "")
      if (!email || !password) {
        return NextResponse.json(
          { ok: false, message: "Correo y contraseña requeridos" },
          { status: 400 }
        )
      }
      await activarUsuarioClienteExistente({
        email,
        password,
        idSede: session.id_sede,
        idActor: session.id_usuario,
      })
      return jsonData({
        ok: true,
        message: "Cuenta web activada para el cliente",
      })
    }

    if (body.action === "crear") {
      await registrarClienteCompleto(session.id_usuario, {
        nombre: String(body.nombre ?? "").trim(),
        apellido: String(body.apellido ?? "").trim(),
        ci: String(body.ci ?? "").trim(),
        telefono: String(body.telefono ?? "").trim(),
        email: String(body.email ?? "").trim(),
        direccion: String(body.direccion ?? "").trim(),
        nit: String(body.nit ?? "").trim(),
        idSede: session.id_sede,
      })

      // Opcional: crear usuario web para el cliente inmediato (si se solicitó)
      if (body.crear_usuario && body.password) {
        const email = String(body.email ?? "").trim().toLowerCase()
        const password = String(body.password ?? "")
        if (email && password) {
          await activarUsuarioClienteExistente({
            email,
            password,
            idSede: session.id_sede,
            idActor: session.id_usuario,
          })
        }
      }

      return jsonData({ ok: true, message: "Cliente registrado en su sede" })
    }

    if (body.action === "editar") {
      const idCliente = Number(body.id_cliente)
      if (!idCliente) {
        return NextResponse.json(
          { ok: false, message: "id_cliente requerido" },
          { status: 400 }
        )
      }
      const existe = await getClienteDetalle(idCliente, session.id_sede)
      if (!existe) {
        return NextResponse.json(
          { ok: false, message: "No puede editar clientes de otra sede" },
          { status: 403 }
        )
      }
      await modificarCliente({
        idCliente,
        telefono:
          body.telefono != null ? String(body.telefono).trim() : undefined,
        email: body.email != null ? String(body.email).trim() : undefined,
        direccion:
          body.direccion != null ? String(body.direccion).trim() : undefined,
        nit: body.nit != null ? String(body.nit).trim() : undefined,
      })
      return jsonData({ ok: true, message: "Cliente actualizado" })
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[vendedor/clientes POST]", error)
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

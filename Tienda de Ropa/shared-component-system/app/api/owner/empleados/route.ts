import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { jsonData } from "@/lib/api/json-response"
import { sanitizeRows } from "@/lib/api/sanitize-rows"
import { getIdSedeCentral } from "@/lib/data/config"
import {
  actualizarPerfilLaboral,
  contratarPersonalCompleto,
  getDirectorioRRHH,
  getEmpleadoDetalle,
} from "@/lib/data/persona"
import { crearUsuarioEmpleado } from "@/lib/data/seguridad"
import { desactivarEmpleado } from "@/lib/data/persona"
import { getSqlErrorMessage } from "@/lib/db/errors"

const NIVELES_OWNER = [2, 3] as const

export async function GET(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const idParam = new URL(request.url).searchParams.get("id")
    const idSedeCentral = await getIdSedeCentral()

    if (idParam) {
      const detalle = await getEmpleadoDetalle(Number(idParam))
      if (!detalle) {
        return NextResponse.json(
          { ok: false, message: "Empleado no encontrado" },
          { status: 404 }
        )
      }
      return jsonData({ ok: true, empleado: sanitizeRows([detalle])[0], id_sede_central: idSedeCentral })
    }

    const empleados = await getDirectorioRRHH(idSedeCentral)
    return jsonData({
      ok: true,
      empleados: sanitizeRows(empleados),
      id_sede_central: idSedeCentral,
      sede_nombre: "Central",
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["admin-global"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const idSede = await getIdSedeCentral()

    if (body.action === "contratar") {
      const idEmpleado = await contratarPersonalCompleto(session.id_usuario, {
        nombre: String(body.nombre ?? "").trim(),
        apellido: String(body.apellido ?? "").trim(),
        ci: String(body.ci ?? "").trim(),
        telefono: String(body.telefono ?? "").trim(),
        email: String(body.email ?? "").trim(),
        direccion: String(body.direccion ?? "").trim(),
        fechaContratacion: String(body.fecha_contratacion ?? "").trim(),
        salario: Number(body.salario),
        idSede,
      })

      if (body.crear_usuario && body.username && body.password) {
        const nivel = Number(body.nivel_acceso ?? 2)
        if (!NIVELES_OWNER.includes(nivel as 2 | 3)) {
          return NextResponse.json(
            { ok: false, message: "Dueño puede crear vendedor (2) o admin sede (3)" },
            { status: 403 }
          )
        }
        await crearUsuarioEmpleado(session.id_usuario, {
          idEmpleado,
          username: String(body.username).trim(),
          password: String(body.password),
          nivelAcceso: nivel,
          idSede,
        })
      }

      return jsonData({
        ok: true,
        id_empleado: idEmpleado,
        message: "Empleado contratado en Central",
      })
    }

    if (body.action === "editar_salario") {
      const idEmpleado = Number(body.id_empleado)
      const existe = await getEmpleadoDetalle(idEmpleado)
      if (!existe) {
        return NextResponse.json(
          { ok: false, message: "Empleado no encontrado" },
          { status: 404 }
        )
      }
      await actualizarPerfilLaboral({
        idEmpleado,
        salario: Number(body.salario),
      })
      return jsonData({ ok: true, message: "Salario actualizado" })
    }

    if (body.action === "desactivar") {
      const idEmpleado = Number(body.id_empleado)
      if (!idEmpleado) {
        return NextResponse.json({ ok: false, message: "id_empleado requerido" }, { status: 400 })
      }
      const existe = await getEmpleadoDetalle(idEmpleado)
      if (!existe) {
        return NextResponse.json({ ok: false, message: "Empleado no encontrado" }, { status: 404 })
      }
      await desactivarEmpleado(idEmpleado)
      return jsonData({ ok: true, message: "Empleado desactivado" })
    }

    return NextResponse.json({ ok: false, message: "Acción no válida" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

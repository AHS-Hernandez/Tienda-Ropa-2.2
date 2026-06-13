import { NextResponse } from "next/server"
import { requireApiSession, sessionIsResponse } from "@/lib/auth/api"
import { getUsuariosSistema } from "@/lib/data/admin"
import { getDirectorioRRHH } from "@/lib/data/persona"
import {
  crearUsuarioEmpleado,
  actualizarSeguridadUsuario,
} from "@/lib/data/seguridad"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET() {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const [usuarios, empleados] = await Promise.all([
      getUsuariosSistema(session.id_sede),
      getDirectorioRRHH(session.id_sede),
    ])
    return NextResponse.json({ ok: true, usuarios, empleados })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const nivel = Number(body.nivel_acceso ?? 2)
    if (nivel !== 2) {
      return NextResponse.json(
        { ok: false, message: "Admin de sede solo puede crear usuarios vendedor (nivel 2)" },
        { status: 403 }
      )
    }
    await crearUsuarioEmpleado(session.id_usuario, {
      idEmpleado: Number(body.id_empleado),
      username: body.username,
      password: body.password,
      nivelAcceso: nivel,
      idSede: session.id_sede,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await requireApiSession(["admin-sede"])
  if (sessionIsResponse(session)) return session

  try {
    const body = await request.json()
    const nuevoNivel = Number(body.nivel_acceso)
    if (nuevoNivel !== 2) {
      return NextResponse.json(
        { ok: false, message: "Admin de sede solo puede asignar nivel vendedor (2)" },
        { status: 403 }
      )
    }
    await actualizarSeguridadUsuario(session.id_usuario, {
      idUsuarioDestino: Number(body.id_usuario),
      nuevoNivel,
      estado: body.estado !== false,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

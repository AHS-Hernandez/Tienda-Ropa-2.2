import { NextResponse } from "next/server"
import {
  activarUsuarioClienteExistente,
  registroMaestroCliente,
  buscarPersonaPorEmail,
} from "@/lib/data/registro"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim()
  if (!email) {
    return NextResponse.json({ ok: false, message: "email requerido" }, { status: 400 })
  }

  try {
    const persona = await buscarPersonaPorEmail(email)
    if (!persona) {
      return NextResponse.json({
        ok: true,
        encontrado: false,
        puede_activar: false,
      })
    }
    const tieneCuenta = Number(persona.tiene_cuenta) === 1
    return NextResponse.json({
      ok: true,
      encontrado: true,
      puede_activar: !tieneCuenta,
      tiene_cuenta: tieneCuenta,
      nombre: `${persona.Nombre} ${persona.Apellido}`,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (body.action === "activar_existente" || body.modo === "existente") {
      if (!email || !password) {
        return NextResponse.json(
          { ok: false, message: "Correo y contraseña son obligatorios." },
          { status: 400 }
        )
      }
      await activarUsuarioClienteExistente({ email, password })
      return NextResponse.json({
        ok: true,
        message: "Cuenta activada. Inicie sesión con su correo y contraseña.",
      })
    }

    const nombre = String(body.nombre ?? "").trim()
    const apellido = String(body.apellido ?? "").trim()
    const ci = String(body.ci ?? "").trim()
    const telefono = String(body.telefono ?? "").trim()
    const direccion = String(body.direccion ?? "").trim()
    const nit = body.nit ? String(body.nit).trim() : undefined

    if (!nombre || !apellido || !ci || !telefono || !email || !direccion || !password) {
      return NextResponse.json(
        { ok: false, message: "Complete todos los campos obligatorios." },
        { status: 400 }
      )
    }

    await registroMaestroCliente({
      nombre,
      apellido,
      ci,
      telefono,
      email,
      direccion,
      password,
      nit,
    })

    return NextResponse.json({
      ok: true,
      message: "Cuenta creada. Inicie sesión con su correo y contraseña.",
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: getSqlErrorMessage(error) },
      { status: 400 }
    )
  }
}

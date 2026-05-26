import { NextResponse } from "next/server"
import { registroMaestroCliente } from "@/lib/data/registro"
import { getSqlErrorMessage } from "@/lib/db/errors"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const nombre = String(body.nombre ?? "").trim()
    const apellido = String(body.apellido ?? "").trim()
    const ci = String(body.ci ?? "").trim()
    const telefono = String(body.telefono ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const direccion = String(body.direccion ?? "").trim()
    const password = String(body.password ?? "")
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

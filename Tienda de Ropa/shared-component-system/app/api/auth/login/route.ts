import { NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth/login-service"
import { setSessionCookie } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const username = typeof body.username === "string" ? body.username : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!username.trim() || !password) {
      return NextResponse.json(
        { ok: false, message: "Usuario y contraseña son obligatorios." },
        { status: 400 }
      )
    }

    const result = await authenticateUser(username, password)

    if (!result.ok) {
      return NextResponse.json(result, { status: 401 })
    }

    await setSessionCookie(result.user)

    return NextResponse.json({
      ok: true,
      redirectTo: result.redirectTo,
      user: {
        username: result.user.username,
        nombreCompleto: result.user.nombreCompleto,
        role: result.user.role,
        nivelAcceso: result.user.nivelAcceso,
      },
    })
  } catch (error) {
    console.error("[POST /api/auth/login]", error)
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error && error.message.includes("AUTH_SECRET")
            ? "Configuración de sesión incompleta (AUTH_SECRET)."
            : "Error interno al iniciar sesión.",
      },
      { status: 500 }
    )
  }
}

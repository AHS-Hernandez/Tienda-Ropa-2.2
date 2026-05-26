import { NextResponse } from "next/server"
import { ROLE_TO_NIVEL } from "@/lib/auth/constants"
import { getSession } from "@/lib/auth/session"
import type { SessionUser } from "@/lib/auth/types"
import type { UserRole } from "@/lib/navigation"

export async function requireApiSession(
  allowedRoles?: UserRole[]
): Promise<SessionUser | NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 })
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Acceso denegado" }, { status: 403 })
  }
  return session
}

export function sessionIsResponse(
  value: SessionUser | NextResponse
): value is NextResponse {
  return value instanceof NextResponse
}

export function canSeeCosto(session: SessionUser): boolean {
  return session.nivelAcceso >= ROLE_TO_NIVEL["admin-global"]
}

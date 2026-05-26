import type { UserRole } from "@/lib/navigation"
import type { NivelAcceso } from "@/lib/auth/constants"

export interface SessionUser {
  id_usuario: number
  id_persona: number
  id_sede: number
  username: string
  nombreCompleto: string
  nivelAcceso: NivelAcceso
  role: UserRole
}

export interface LoginResult {
  ok: true
  user: SessionUser
  redirectTo: string
}

export interface LoginError {
  ok: false
  message: string
}

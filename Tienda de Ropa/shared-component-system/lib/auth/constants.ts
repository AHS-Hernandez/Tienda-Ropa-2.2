import type { UserRole } from "@/lib/navigation"

export type NivelAcceso = 1 | 2 | 3 | 4

export const NIVEL_TO_ROLE: Record<NivelAcceso, UserRole> = {
  1: "cliente",
  2: "vendedor",
  3: "admin-sede",
  4: "admin-global",
}

export const ROLE_TO_NIVEL: Record<UserRole, NivelAcceso> = {
  cliente: 1,
  vendedor: 2,
  "admin-sede": 3,
  "admin-global": 4,
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  cliente: "/cliente/home",
  vendedor: "/vendedor/pos",
  "admin-sede": "/admin-sede/dashboard",
  "admin-global": "/owner/dashboard",
}

export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  cliente: "/cliente",
  vendedor: "/vendedor",
  "admin-sede": "/admin-sede",
  "admin-global": "/owner",
}

export function nivelToRole(nivel: number): UserRole | null {
  if (nivel >= 1 && nivel <= 4) return NIVEL_TO_ROLE[nivel as NivelAcceso]
  return null
}

export function roleFromPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/cliente")) return "cliente"
  if (pathname.startsWith("/vendedor")) return "vendedor"
  if (pathname.startsWith("/admin-sede")) return "admin-sede"
  if (pathname.startsWith("/owner")) return "admin-global"
  return null
}

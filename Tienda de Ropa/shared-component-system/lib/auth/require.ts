import { redirect } from "next/navigation"
import { ROLE_HOME_PATH } from "@/lib/auth/constants"
import { getSession } from "@/lib/auth/session"
import type { SessionUser } from "@/lib/auth/types"
import type { UserRole } from "@/lib/navigation"

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    redirect("/auth/login")
  }
  return session
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const session = await requireSession()
  if (session.role !== role) {
    redirect(ROLE_HOME_PATH[session.role])
  }
  return session
}

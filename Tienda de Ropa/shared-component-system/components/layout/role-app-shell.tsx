"use client"

import { MainLayout } from "@/components/layout/main-layout"
import type { SessionUser } from "@/lib/auth/types"
import type { UserRole } from "@/lib/navigation"

interface RoleAppShellProps {
  role: UserRole
  session: SessionUser
  children: React.ReactNode
}

export function RoleAppShell({ role, session, children }: RoleAppShellProps) {
  return (
    <MainLayout role={role} session={session}>
      {children}
    </MainLayout>
  )
}

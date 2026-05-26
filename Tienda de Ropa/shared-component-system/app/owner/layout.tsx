import { requireRole } from "@/lib/auth/require"
import { RoleAppShell } from "@/components/layout/role-app-shell"

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("admin-global")

  return (
    <RoleAppShell role="admin-global" session={session}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</div>
    </RoleAppShell>
  )
}

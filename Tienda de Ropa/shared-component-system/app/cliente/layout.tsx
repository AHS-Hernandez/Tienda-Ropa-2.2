import { requireRole } from "@/lib/auth/require"
import { RoleAppShell } from "@/components/layout/role-app-shell"

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("cliente")

  return (
    <RoleAppShell role="cliente" session={session}>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</div>
    </RoleAppShell>
  )
}

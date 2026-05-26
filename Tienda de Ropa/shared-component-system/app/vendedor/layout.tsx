import { requireRole } from "@/lib/auth/require"
import { RoleAppShell } from "@/components/layout/role-app-shell"

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole("vendedor")

  return (
    <RoleAppShell role="vendedor" session={session}>
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8">{children}</div>
    </RoleAppShell>
  )
}

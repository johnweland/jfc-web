import { requireAdmin } from "@/lib/auth/server"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin({
    redirectTo: "/admin",
  })

  return <AdminShell>{children}</AdminShell>
}

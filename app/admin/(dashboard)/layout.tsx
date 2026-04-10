import { AdminSidebar } from '../_components/AdminSidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-muted-warm">
      <AdminSidebar />
      <main className="ml-[240px] min-h-screen p-8">{children}</main>
    </div>
  )
}

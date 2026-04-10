import { KpiDashboardClient } from './components/KpiDashboardClient'

export default function KpiPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">KPI Tracker</h1>
        <p className="text-muted-foreground text-sm">
          Cập nhật số liệu hàng tuần để theo dõi tiến độ Hoshins.
        </p>
      </div>
      <KpiDashboardClient />
    </div>
  )
}

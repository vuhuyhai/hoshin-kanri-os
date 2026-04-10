import { KpiDashboardClient } from './components/KpiDashboardClient'

export default function KpiPage() {
  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b-[3px] border-ink">
        <p className="overline mb-1">Performance</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          KPI Tracker
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Cập nhật số liệu hàng tuần để theo dõi tiến độ Hoshins.
        </p>
      </div>
      <KpiDashboardClient />
    </div>
  )
}

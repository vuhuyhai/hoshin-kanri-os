import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRedStreaks } from '@/lib/hansei/queries'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { KpiDashboardClient } from './components/KpiDashboardClient'
import { KpiHanseiSection } from './components/KpiHanseiSection'
import { KpiGembaSection } from './components/KpiGembaSection'

export default async function KpiPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)

  const orgId = membership?.org_id ?? ''
  const role = (membership?.role ?? 'Member') as 'CEO' | 'Manager' | 'Member'
  const redStreaks = orgId ? await getRedStreaks(supabase, orgId) : []

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
      {/* Gemba banner top + Context Provider wrap children. Hansei
          banner sau gemba (decision Task 1: 2 banner stack riêng). */}
      <KpiGembaSection orgId={orgId} role={role}>
        <KpiHanseiSection initialRedStreaks={redStreaks} />
        <KpiDashboardClient userRole={role} />
      </KpiGembaSection>
    </div>
  )
}

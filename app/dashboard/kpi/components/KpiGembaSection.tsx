import { createClient } from '@/lib/supabase/server'
import {
  getGembaUnreadSummary,
  listGembaCommentsByTarget,
} from '@/lib/gemba/queries'
import type { GembaCommentWithAuthor } from '@/lib/gemba/types'
import { KpiGembaSectionClient } from './KpiGembaSectionClient'

interface Props {
  orgId: string
  role: 'CEO' | 'Manager' | 'Member'
  children: React.ReactNode
}

// Server Component: fetch unread summary + per-KPI comments,
// pass xuống Client Component wrapper (Context Provider).
//
// Trade-off: N+1 queries (1 summary + 1 listGembaCommentsByTarget /
// KPI). Mỗi listGembaCommentsByTarget bên trong làm 2 round-trips
// (comments + profiles). Org có 20 KPIs = ~41 round-trips. Acceptable
// cho v1 — optimize sau qua bulk query nếu hot path.
export async function KpiGembaSection({ orgId, role, children }: Props) {
  if (!orgId) {
    return <>{children}</>
  }

  const supabase = await createClient()

  const { data: kpis } = await supabase
    .from('kpis')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_active', true)

  const summary = await getGembaUnreadSummary(supabase, orgId)

  const kpiIds = kpis?.map((k) => k.id) ?? []
  const commentsPerKpi = await Promise.all(
    kpiIds.map((id) => listGembaCommentsByTarget(supabase, orgId, 'kpi', id)),
  )

  const commentsMap: Record<string, GembaCommentWithAuthor[]> = {}
  kpiIds.forEach((id, idx) => {
    commentsMap[id] = commentsPerKpi[idx] ?? []
  })

  return (
    <KpiGembaSectionClient
      summary={summary}
      commentsMap={commentsMap}
      role={role}
    >
      {children}
    </KpiGembaSectionClient>
  )
}

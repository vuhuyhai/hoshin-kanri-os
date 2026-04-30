import { createClient } from '@/lib/supabase/server'
import {
  getGembaUnreadSummary,
  listGembaCommentsByTarget,
} from '@/lib/gemba/queries'
import type { GembaCommentWithAuthor } from '@/lib/gemba/types'
import type { XMatrixHoshin } from '@/lib/x-matrix/types'
import { HoshinGembaSectionClient } from './HoshinGembaSectionClient'

interface Props {
  orgId: string
  userRole: 'CEO' | 'Manager' | 'Member'
  hoshins: XMatrixHoshin[]
  xMatrixId: string | null
  children: React.ReactNode
}

// Server Component parallel KpiGembaSection. Difference: source
// hoshins từ vision_json.hoshins[] (đã fetch ở page.tsx) thay vì
// query table — Hoshin không có table riêng, sống trong JSONB.
//
// MAX_HOSHINS=5 → ≤6 round-trips (1 summary + ≤5 list-by-target),
// thấp hơn KPI side đã accept (≤21).
export async function HoshinGembaSection({
  orgId,
  userRole,
  hoshins,
  xMatrixId,
  children,
}: Props) {
  if (!orgId) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const summary = await getGembaUnreadSummary(supabase, orgId)

  const hoshinIds = hoshins.map((h) => h.id)
  const commentsPerHoshin = await Promise.all(
    hoshinIds.map((id) =>
      listGembaCommentsByTarget(supabase, orgId, 'hoshin', id),
    ),
  )

  const commentsMap: Record<string, GembaCommentWithAuthor[]> = {}
  hoshinIds.forEach((id, idx) => {
    commentsMap[id] = commentsPerHoshin[idx] ?? []
  })

  return (
    <HoshinGembaSectionClient
      summary={summary}
      commentsMap={commentsMap}
      role={userRole}
      xMatrixId={xMatrixId}
      existingHoshinIds={hoshinIds}
    >
      {children}
    </HoshinGembaSectionClient>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { SwotWorkshopFlow } from '@/components/swot/SwotWorkshopFlow'

export default async function SwotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)
  if (!membership) redirect('/onboarding/setup-org')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, city, headcount')
    .eq('id', membership.org_id)
    .maybeSingle()

  if (!org) redirect('/onboarding/setup-org')

  const { data: existingAnalysis } = await supabase
    .from('swot_analyses')
    .select('id')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let analysisId = existingAnalysis?.id

  if (!analysisId) {
    const { data: newAnalysis } = await supabase
      .from('swot_analyses')
      .insert({
        org_id: membership.org_id,
        quadrant: 'S',
        statement: 'TOWS Analysis Session',
        framework_source: 'manual',
      })
      .select('id')
      .single()
    analysisId = newAnalysis?.id
  }

  if (!analysisId) {
    return (
      <div className="w-full min-h-full p-6">
        <div style={{ padding: 24, border: '2px solid #c73937', color: '#c73937' }}>
          Không thể tạo phiên phân tích SWOT. Vui lòng thử tải lại trang.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] min-h-0 overflow-hidden">
      <SwotWorkshopFlow
        orgData={{
          industry: org.industry,
          headcount: org.headcount,
          city: org.city,
        }}
        orgId={membership.org_id}
        analysisId={analysisId}
      />
    </div>
  )
}

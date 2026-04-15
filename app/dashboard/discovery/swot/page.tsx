import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SwotWorkshopFlow } from '@/components/swot/SwotWorkshopFlow'

export default async function SwotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, city, headcount')
    .eq('id', membership.org_id)
    .single()

  if (!org) redirect('/onboarding/setup-org')

  const { data: existingAnalysis } = await supabase
    .from('swot_analyses')
    .select('id')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

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
    <div className="w-full h-full min-h-0">
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

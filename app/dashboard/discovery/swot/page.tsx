import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SwotPageTabs } from './SwotPageTabs'
import type { OrgContext } from '@/lib/swot/types'

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

  const orgContext: OrgContext = {
    orgId: membership.org_id,
    orgName: org.name,
    industry: org.industry,
    city: org.city,
    headcount: org.headcount,
  }

  // Find most recent swot_analyses entry for this org (acts as session anchor for swot_factors)
  const { data: existingAnalysis } = await supabase
    .from('swot_analyses')
    .select('id')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let analysisId = existingAnalysis?.id

  // If none exists, create an anchor entry
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

  return (
    <div className="w-full min-h-full">
      <SwotPageTabs
        orgContext={orgContext}
        userId={user.id}
        analysisId={analysisId!}
        orgId={membership.org_id}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoachingClient } from './components/CoachingClient'
import type { OrgContext } from '@/lib/swot/types'

export default async function CoachingPage() {
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <CoachingClient orgContext={orgContext} />
    </div>
  )
}

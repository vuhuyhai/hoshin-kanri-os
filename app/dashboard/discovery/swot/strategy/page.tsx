import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StrategyClient } from './components/StrategyClient'

export default async function StrategyPage() {
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
    .select('name, industry, headcount')
    .eq('id', membership.org_id)
    .single()

  if (!org) redirect('/onboarding/setup-org')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <StrategyClient
        orgId={membership.org_id}
        orgContext={{
          name: org.name,
          industry: org.industry,
          headcount: parseInt(org.headcount) || 10,
        }}
      />
    </div>
  )
}

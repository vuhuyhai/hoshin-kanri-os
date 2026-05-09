import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { SynthesisClient } from './components/SynthesisClient'

export default async function SynthesisPage() {
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
    .single()
  if (!org) redirect('/onboarding/setup-org')

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      <SynthesisClient
        orgId={membership.org_id}
        orgContext={{
          orgName: org.name,
          industry: org.industry,
          city: org.city,
          headcount: org.headcount,
        }}
      />
    </div>
  )
}

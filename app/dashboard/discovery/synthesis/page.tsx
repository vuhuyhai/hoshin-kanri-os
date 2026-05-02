import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SynthesisClient } from './components/SynthesisClient'

export default async function SynthesisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, organizations(name, industry, city, headcount)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) redirect('/onboarding/setup-org')

  const lastOrgId = user.user_metadata?.last_org_id as string | undefined
  const membership = lastOrgId
    ? (memberships.find((m) => m.org_id === lastOrgId) ?? memberships[0])
    : memberships[0]

  const org = membership.organizations as {
    name: string
    industry: string
    city: string
    headcount: string
  }

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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SynthesisClient } from './components/SynthesisClient'

export default async function SynthesisPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name, industry, city, headcount)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const org = membership.organizations as {
    name: string
    industry: string
    city: string
    headcount: string
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
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

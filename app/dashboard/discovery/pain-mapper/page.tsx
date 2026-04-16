import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PainMapperClient } from './components/PainMapperClient'

export default async function PainMapperPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name, industry, city)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const org = membership.organizations as {
    name: string
    industry: string
    city: string
  }

  return (
    <PainMapperClient
      orgContext={{
        orgName: org.name ?? '',
        industry: org.industry ?? '',
        city: org.city ?? '',
      }}
    />
  )
}

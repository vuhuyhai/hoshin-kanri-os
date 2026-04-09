import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SwotContainer } from './components/SwotContainer'
import type { OrgContext } from '@/lib/swot/types'

export default async function SwotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
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
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Phân tích SWOT</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI Coach sẽ giúp bạn phân tích điểm mạnh, điểm yếu, cơ hội và thách
          thức
        </p>
      </div>
      <SwotContainer orgContext={orgContext} />
    </div>
  )
}

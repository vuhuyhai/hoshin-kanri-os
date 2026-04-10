import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SwotHubClient } from './components/SwotHubClient'

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <SwotHubClient orgId={membership.org_id} />
    </div>
  )
}

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
    <div className="w-full min-h-full p-6 lg:p-8">
      <SwotHubClient orgId={membership.org_id} />
    </div>
  )
}

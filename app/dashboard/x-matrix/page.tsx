import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Base /dashboard/x-matrix route. Sidebar + bottom-nav link here.
// No dedicated view page yet — send user to the wizard, which pre-fills
// from their existing active x_matrix (via /api/x-matrix/prefill) so
// returning users see their current data.
export default async function XMatrixIndexPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) redirect('/onboarding/setup-org')

  redirect('/dashboard/x-matrix/new')
}

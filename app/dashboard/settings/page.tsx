import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) redirect('/onboarding/setup-org')

  const lastOrgId = user.user_metadata?.last_org_id as string | undefined
  const membership = lastOrgId
    ? (memberships.find((m) => m.org_id === lastOrgId) ?? memberships[0])
    : memberships[0]

  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, headcount, city')
    .eq('id', membership.org_id)
    .maybeSingle()

  if (!org) redirect('/onboarding/setup-org')

  const { data: membersData } = await supabase
    .from('org_members')
    .select('user_id, role, created_at, users(email, full_name)')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: true })

  const members = (membersData ?? []).map((m) => {
    const u = m.users as { full_name?: string | null; email: string } | null
    return {
      userId: m.user_id,
      email: u?.email ?? '',
      fullName: u?.full_name ?? null,
      role: m.role,
      joinedAt: m.created_at ?? '',
    }
  })

  const { data: invitesData } =
    membership.role !== 'Member'
      ? await supabase
          .from('org_invites')
          .select('id, email, role, token, expires_at, created_at')
          .eq('org_id', membership.org_id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
      : { data: [] }

  const invites = (invitesData ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role,
    token: i.token,
    expiresAt: i.expires_at,
    createdAt: i.created_at,
  }))

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b-[3px] border-ink">
        <p className="overline mb-1">Admin</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          Cài đặt
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Quản lý thông tin công ty và thành viên
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SettingsClient
            org={org}
            members={members}
            invites={invites}
            currentUserId={user.id}
            isCeo={membership.role === 'CEO'}
          />
        </div>
      </div>
    </div>
  )
}

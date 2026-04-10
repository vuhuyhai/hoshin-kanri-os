import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './components/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, headcount, city')
    .eq('id', membership.org_id)
    .single()

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
      joinedAt: m.created_at,
    }
  })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground text-sm">
          Quản lý thông tin công ty và thành viên
        </p>
      </div>
      <SettingsClient
        org={org}
        members={members}
        currentUserId={user.id}
        isCeo={membership.role === 'CEO'}
      />
    </div>
  )
}

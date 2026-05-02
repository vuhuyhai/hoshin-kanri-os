import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { IdentifyUser } from '@/components/analytics/IdentifyUser'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect('/login')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('org_members')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!memberships || memberships.length === 0) redirect('/onboarding/setup-org')

  // Multi-org: prefer org matching user metadata, fallback to most recently joined
  const lastOrgId = user.user_metadata?.last_org_id as string | undefined
  const membership = lastOrgId
    ? (memberships.find((m) => m.org_id === lastOrgId) ?? memberships[0])
    : memberships[0]

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.org_id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const orgName = org?.name ?? 'Công ty'
  const orgIndustry = org?.industry ?? ''
  const userName = profile?.full_name ?? ''
  const userEmail = user.email ?? ''
  const userRole = membership.role ?? ''

  return (
    <div className="flex min-h-screen bg-bg-warm">
      <IdentifyUser
        userId={user.id}
        orgId={membership.org_id}
        orgName={orgName}
        role={userRole}
        industry={orgIndustry}
      />

      {/* Sidebar — desktop only (lg+) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col lg:border-r-[3px] lg:border-ink lg:overflow-y-auto">
        <Sidebar
          userRole={userRole}
          orgName={orgName}
          orgIndustry={orgIndustry}
          userName={userName}
          userEmail={userEmail}
        />
      </aside>

      {/* Main area — offset by sidebar on desktop */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <Header
          orgName={orgName}
          userEmail={userEmail}
          userRole={userRole}
          orgIndustry={orgIndustry}
          userName={userName}
        />

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile/tablet only */}
      <BottomNav className="lg:hidden" />
    </div>
  )
}

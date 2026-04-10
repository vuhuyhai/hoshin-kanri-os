import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
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

  const orgName = org?.name ?? 'Công ty'

  return (
    <div className="flex h-screen overflow-hidden">
      <IdentifyUser
        userId={user.id}
        orgId={membership.org_id}
        orgName={orgName}
        role={membership.role}
        industry={org?.industry ?? ''}
      />
      <Sidebar userRole={membership.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header orgName={orgName} userEmail={user.email ?? ''} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

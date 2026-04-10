import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XMatrixWizard } from '@/components/x-matrix/XMatrixWizard'
import type { OrgMember } from '@/lib/x-matrix/types'

export default async function NewXMatrixPage() {
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

  // Org members for KPI owner select
  const { data: membersData } = await supabase
    .from('org_members')
    .select('user_id, role, users(email, full_name)')
    .eq('org_id', membership.org_id)

  const members: OrgMember[] = (membersData ?? []).map((m) => {
    const u = m.users as { full_name?: string | null; email: string } | null
    return {
      userId: m.user_id,
      fullName: u?.full_name ?? u?.email ?? 'Unknown',
      email: u?.email ?? '',
      role: m.role as OrgMember['role'],
    }
  })

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto mb-8 space-y-1">
        <h1 className="text-2xl font-bold">X-Matrix Builder</h1>
        <p className="text-muted-foreground text-sm">
          Kế hoạch chiến lược 1 năm · Đã pre-fill từ Discovery · Review và
          confirm
        </p>
      </div>
      <XMatrixWizard orgId={membership.org_id} members={members} />
    </div>
  )
}

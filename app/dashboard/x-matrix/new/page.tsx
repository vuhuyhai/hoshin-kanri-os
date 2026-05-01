import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XMatrixCanvasPage } from '@/components/x-matrix/canvas/XMatrixCanvasPage'
import { HoshinGembaSection } from './components/HoshinGembaSection'
import type { OrgMember, XMatrixData } from '@/lib/x-matrix/types'

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
    .maybeSingle()

  if (!membership) redirect('/onboarding/setup-org')

  // Canvas là edit-flow CEO/Manager. Member không có edit affordance
  // → redirect /dashboard (KPI + Hansei + Gemba writeable). Future
  // M-Hoshin-7 nới Member writer Hoshin sẽ revisit gate này.
  if (membership.role === 'Member') {
    redirect('/dashboard')
  }

  const canEdit = membership.role === 'CEO' || membership.role === 'Manager'

  const { data: existingMatrix } = await supabase
    .from('x_matrices')
    .select('id, vision_json')
    .eq('org_id', membership.org_id)
    .eq('status', 'active')
    .maybeSingle()

  const initialData =
    (existingMatrix?.vision_json as XMatrixData | null) ?? undefined

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

  const hoshinsForGemba = initialData?.hoshins ?? []

  return (
    <HoshinGembaSection
      orgId={membership.org_id}
      userRole={membership.role as 'CEO' | 'Manager'}
      hoshins={hoshinsForGemba}
      xMatrixId={existingMatrix?.id ?? null}
    >
      <XMatrixCanvasPage
        orgId={membership.org_id}
        members={members}
        canEdit={canEdit}
        xMatrixId={existingMatrix?.id}
        initialData={initialData}
      />
    </HoshinGembaSection>
  )
}

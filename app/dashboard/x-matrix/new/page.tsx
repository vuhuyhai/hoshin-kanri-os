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

  // canEdit excludes Member — Member-POV read-only canvas access shipped
  // M-Member-POV-1. Edit affordances gated UI-side via useCanEdit() Context
  // (Task 2A-2C). Member can still submit gemba feedback on Hoshin via
  // GembaModal (Q3 alpha decision).
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
      userRole={membership.role as 'CEO' | 'Manager' | 'Member'}
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

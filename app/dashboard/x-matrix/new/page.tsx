import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XMatrixWizard } from '@/components/x-matrix/XMatrixWizard'
import { XMatrixCanvasPage } from '@/components/x-matrix/canvas/XMatrixCanvasPage'
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

  // Canvas default. Set NEXT_PUBLIC_XMATRIX_CANVAS=0 in env to rollback to legacy wizard.
  // After 2 weeks of stable production, remove this flag and delete wizard files.
  const useLegacyWizard = process.env.NEXT_PUBLIC_XMATRIX_CANVAS === '0'

  if (useLegacyWizard) {
    return (
      <div className="w-full min-h-full p-6 lg:p-8">
        <div className="max-w-4xl mx-auto mb-8 pb-6 border-b-[3px] border-ink">
          <p className="overline mb-1">Strategy</p>
          <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
            X-Matrix Builder
          </h1>
          <p className="font-body text-text-2 mt-1 text-base">
            Kế hoạch chiến lược 1 năm · Đã pre-fill từ Discovery · Review và
            confirm
          </p>
        </div>
        <XMatrixWizard orgId={membership.org_id} members={members} />
      </div>
    )
  }

  return (
    <XMatrixCanvasPage
      orgId={membership.org_id}
      members={members}
      canEdit={canEdit}
      xMatrixId={existingMatrix?.id}
      initialData={initialData}
    />
  )
}

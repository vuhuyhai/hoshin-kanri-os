import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { TowsStrategyClient } from './TowsStrategyClient'

export default async function SwotStrategyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)
  if (!membership) redirect('/onboarding/setup-org')

  const { data: existingAnalysis } = await supabase
    .from('swot_analyses')
    .select('id')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const analysisId = existingAnalysis?.id

  if (!analysisId) {
    return (
      <div className="w-full min-h-full p-6">
        <div
          className="max-w-xl mx-auto border-2 border-ink bg-white p-6 shadow-[5px_5px_0_#2C2B2B]"
          style={{ color: '#c73937' }}
        >
          <h1 className="font-body font-black uppercase text-lg mb-2">
            Chưa có phân tích SWOT
          </h1>
          <p className="font-display text-sm text-text-2">
            Quay lại bước SWOT để tạo nguyên liệu trước khi kết hợp chiến lược.
          </p>
          <a
            href="/dashboard/discovery/swot"
            className="inline-flex items-center gap-1 mt-4 border-2 border-ink bg-accent-brand text-white font-body font-bold uppercase text-xs tracking-wider px-3 py-2 shadow-[3px_3px_0_#2C2B2B] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            ← Về SWOT Workshop
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-full p-4 md:p-6">
      <TowsStrategyClient
        analysisId={analysisId}
        orgId={membership.org_id}
      />
    </div>
  )
}

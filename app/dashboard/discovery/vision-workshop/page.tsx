import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { VisionWorkshopClient } from './components/VisionWorkshopClient'

export default async function VisionWorkshopPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)
  if (!membership) redirect('/onboarding/setup-org')

  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry, headcount')
    .eq('id', membership.org_id)
    .single()
  if (!org) redirect('/onboarding/setup-org')

  const { data: existingSession } = await supabase
    .from('discovery_sessions')
    .select('data_json')
    .eq('org_id', membership.org_id)
    .eq('step_completed', 'vision')
    .maybeSingle()

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      <div className="mb-8 pb-6 border-b-[3px] border-ink">
        <p className="overline mb-1">Discovery</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          Vision Workshop
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Trả lời 5 câu hỏi để AI draft Vision Statement cho {org.name}.
          Mất khoảng 5 phút.
        </p>
      </div>

      <VisionWorkshopClient
        orgContext={{
          orgName: org.name,
          industry: org.industry,
          headcount: org.headcount,
        }}
        existingData={existingSession?.data_json as {
          answers?: Record<string, string>
          draft?: { visionStatement: string; yearGoals: string[]; timeframe: string }
          finalVision?: string
          finalGoals?: string[]
        } | null ?? null}
      />
    </div>
  )
}

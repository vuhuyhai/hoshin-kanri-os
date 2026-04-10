import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisionWorkshopClient } from './components/VisionWorkshopClient'

export default async function VisionWorkshopPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(name, industry, headcount)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const org = membership.organizations as {
    name: string
    industry: string
    headcount: string
  }

  const { data: existingSession } = await supabase
    .from('discovery_sessions')
    .select('data_json')
    .eq('org_id', membership.org_id)
    .eq('step_completed', 'vision')
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">Vision Workshop</h1>
        <p className="text-muted-foreground text-sm">
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
        orgId={membership.org_id}
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

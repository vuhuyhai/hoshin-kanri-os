import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SynthesisRunner } from './components/SynthesisRunner'

export default async function SynthesisPage() {
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

  if (!org) redirect('/onboarding/setup-org')

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Strategy Synthesis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng hợp toàn bộ Discovery data → X-Matrix pre-fill
        </p>
      </div>
      <SynthesisRunner
        orgId={membership.org_id}
        orgContext={{
          orgName: org.name,
          industry: org.industry,
          city: org.city,
          headcount: org.headcount,
        }}
      />
    </div>
  )
}

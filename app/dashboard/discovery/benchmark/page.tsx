import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BenchmarkLibrary } from './components/BenchmarkLibrary'

export default async function BenchmarkPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, organizations(industry)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding/setup-org')

  const org = membership.organizations as { industry: string }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold">KPI Benchmark Library</h1>
        <p className="text-muted-foreground text-sm">
          Chọn KPIs phù hợp để thêm vào X-Matrix. Benchmark dựa trên dữ liệu
          SME Việt Nam. Target mặc định = Top 25%.
        </p>
      </div>

      <BenchmarkLibrary currentIndustry={org.industry} />
    </div>
  )
}

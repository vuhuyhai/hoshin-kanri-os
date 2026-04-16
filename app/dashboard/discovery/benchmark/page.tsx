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
    .maybeSingle()

  if (!membership) redirect('/onboarding/setup-org')

  const org = membership.organizations as { industry: string }

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      <div className="mb-8 pb-6 border-b-[3px] border-ink">
        <p className="overline mb-1">Discovery</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          KPI Benchmark Library
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Chọn KPIs phù hợp để thêm vào X-Matrix. Benchmark dựa trên dữ liệu
          SME Việt Nam. Target mặc định = Top 25%.
        </p>
      </div>

      <BenchmarkLibrary currentIndustry={org.industry} />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const DISCOVERY_STEPS = [
  { key: 'x-ray', label: 'Business X-Ray', href: '/x-ray' },
  { key: 'swot_coaching', label: 'Phân tích SWOT' },
  { key: 'pain_mapper', label: 'Pain → Goal Mapper' },
  { key: 'vision', label: 'Vision Workshop' },
  { key: 'synthesis', label: 'AI Strategy Synthesis' },
] as const

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user!.id)
    .maybeSingle()

  const displayName = profile?.full_name
    || user?.email?.split('@')[0]
    || 'bạn'

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const orgId = membership?.org_id

  // Discovery sessions
  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('step_completed')
    .eq('org_id', orgId ?? '')

  const completedSteps = new Set(
    sessions?.map((s) => s.step_completed).filter(Boolean) ?? []
  )

  const completedCount = DISCOVERY_STEPS.filter((s) =>
    completedSteps.has(s.key)
  ).length

  // Check for existing X-Matrix. Defensive: order by updated_at + limit(1)
  // so that a pre-existing data pollution (>1 active) doesn't crash the
  // query on .maybeSingle() — we always pick the latest. The create route
  // archives old rows on new inserts and migration 015 enforces a unique
  // partial index at the DB level, but this belt-and-suspenders matches
  // the pattern the prefill API already uses.
  const { data: xMatrix } = await supabase
    .from('x_matrices')
    .select('id')
    .eq('org_id', orgId ?? '')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const hasXMatrix = !!xMatrix

  // Check KPI count
  const { count: kpiCount } = await supabase
    .from('kpis')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId ?? '')
    .eq('is_active', true)

  const allDiscoveryDone = completedCount === DISCOVERY_STEPS.length

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b-[3px] border-ink">
        <p className="heading-overline mb-1">Dashboard</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          Chào {displayName}
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Hoshin Kanri OS giúp bạn biến chiến lược thành hành động đo được.
        </p>
      </div>

      {/* State B: Has X-Matrix — show quick actions */}
      {hasXMatrix && (
        <div className="space-y-6">
          {/* KPI alert */}
          {(kpiCount ?? 0) > 0 && (
            <Link href="/dashboard/kpi">
              <div className="card-brutal flex min-h-[44px] items-center gap-4 p-5 mb-4 cursor-pointer">
                <span className="text-3xl">📊</span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold uppercase tracking-wider">
                    {kpiCount} KPIs đang theo dõi
                  </p>
                  <p className="font-body text-sm text-text-3">
                    Cập nhật số liệu hàng tuần
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-accent-brand uppercase tracking-wider">
                  Xem →
                </span>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Link href="/dashboard/kpi">
              <div className="card-subtle p-6 flex flex-col items-center gap-3 cursor-pointer transition-[background,box-shadow] duration-150 hover:shadow-sm">
                <span className="text-3xl">📈</span>
                <p className="font-display font-bold text-[13px] uppercase tracking-wider text-ink text-center mt-1">
                  KPI Tracker
                </p>
              </div>
            </Link>
            <Link href="/dashboard/report">
              <div className="card-subtle p-6 flex flex-col items-center gap-3 cursor-pointer transition-[background,box-shadow] duration-150 hover:shadow-sm">
                <span className="text-3xl">📄</span>
                <p className="font-display font-bold text-[13px] uppercase tracking-wider text-ink text-center mt-1">
                  Báo cáo tháng
                </p>
              </div>
            </Link>
            <Link href="/dashboard/discovery">
              <div className="card-subtle p-6 flex flex-col items-center gap-3 cursor-pointer transition-[background,box-shadow] duration-150 hover:shadow-sm">
                <span className="text-3xl">🔍</span>
                <p className="font-display font-bold text-[13px] uppercase tracking-wider text-ink text-center mt-1">
                  Discovery Hub
                </p>
              </div>
            </Link>
            <Link href="/dashboard/x-matrix/new">
              <div className="card-subtle p-6 flex flex-col items-center gap-3 cursor-pointer transition-[background,box-shadow] duration-150 hover:shadow-sm">
                <span className="text-3xl">📊</span>
                <p className="font-display font-bold text-[13px] uppercase tracking-wider text-ink text-center mt-1">
                  X-Matrix
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* State A: No X-Matrix — show discovery checklist */}
      {!hasXMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main checklist */}
          <div className="lg:col-span-2 card-brutal p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">
                  {completedCount === 0
                    ? 'Bắt đầu khám phá doanh nghiệp'
                    : allDiscoveryDone
                      ? 'Sẵn sàng tạo X-Matrix!'
                      : `Tiếp tục khám phá`}
                </h2>
                <p className="font-body text-sm text-text-2 mt-1">
                  {allDiscoveryDone
                    ? 'AI đã tổng hợp Discovery data — tạo X-Matrix ngay'
                    : 'Hoàn thành các bước để AI tạo chiến lược cho bạn'}
                </p>
              </div>
              <Badge
                variant={allDiscoveryDone ? 'default' : 'secondary'}
                className="badge-brutal shrink-0"
              >
                {completedCount}/{DISCOVERY_STEPS.length}
              </Badge>
            </div>

            <div className="space-y-2 mb-6">
              {DISCOVERY_STEPS.map((step, idx) => {
                const done = completedSteps.has(step.key)
                const isXRay = 'href' in step
                const inner = (
                  <div
                    className="flex min-h-[44px] items-center gap-3 border-2 border-ink px-4 py-3"
                  >
                    <div
                      className={
                        done
                          ? 'flex h-7 w-7 shrink-0 items-center justify-center bg-accent-brand text-white font-display text-xs font-bold'
                          : 'flex h-7 w-7 shrink-0 items-center justify-center border-2 border-ink/30 font-display text-xs font-bold text-text-3'
                      }
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <span
                      className={
                        done
                          ? 'font-display text-sm font-semibold uppercase tracking-wider line-through text-text-3'
                          : 'font-display text-sm font-semibold uppercase tracking-wider text-ink'
                      }
                    >
                      {step.label}
                      {isXRay && done && (
                        <span className="text-xs bg-[#c73937] text-white px-1 ml-2 normal-case tracking-normal">Nguyên liệu SWOT</span>
                      )}
                    </span>
                  </div>
                )
                return isXRay && !done ? (
                  <a key={step.key} href={step.href} target="_blank" rel="noopener noreferrer">{inner}</a>
                ) : (
                  <div key={step.key}>{inner}</div>
                )
              })}
            </div>

            <Link
              href={
                allDiscoveryDone
                  ? '/dashboard/x-matrix/new'
                  : '/dashboard/discovery'
              }
            >
              <Button className="btn-brutal-primary w-full text-center">
                {completedCount === 0
                  ? 'Bắt đầu khám phá →'
                  : allDiscoveryDone
                    ? 'Tạo X-Matrix →'
                    : 'Tiếp tục →'}
              </Button>
            </Link>
          </div>

          {/* Progress sidebar */}
          <div className="card-brutal p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-accent-brand mb-4">
              Tiến độ
            </h3>
            <div className="mb-4">
              <div className="h-3 w-full border-2 border-ink bg-bg-muted-warm">
                <div
                  className="h-full bg-accent-brand transition-all duration-500"
                  style={{
                    width: `${(completedCount / DISCOVERY_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="font-body text-sm text-text-2 mt-2">
                {completedCount}/{DISCOVERY_STEPS.length} bước hoàn thành
              </p>
            </div>
            <div className="space-y-2">
              {DISCOVERY_STEPS.map((step) => {
                const done = completedSteps.has(step.key)
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-2 font-body text-sm"
                  >
                    <span>{done ? '✅' : '⏳'}</span>
                    <span className={done ? 'text-text-3' : 'text-ink'}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DISCOVERY_STEPS = [
  { key: 'swot', label: 'Phân tích SWOT' },
  { key: 'pain_mapper', label: 'Pain → Goal Mapper' },
  { key: 'vision', label: 'Vision Workshop' },
  { key: 'synthesis', label: 'AI Strategy Synthesis' },
] as const

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'bạn'

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user!.id)
    .single()

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

  // Check for existing X-Matrix
  const { data: xMatrix } = await supabase
    .from('x_matrices')
    .select('id')
    .eq('org_id', orgId ?? '')
    .eq('status', 'active')
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Chào {firstName} 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Hoshin Kanri OS giúp bạn biến chiến lược thành hành động đo được.
        </p>
      </div>

      {/* State B: Has X-Matrix — show quick actions */}
      {hasXMatrix && (
        <div className="space-y-4">
          {/* KPI alert if has KPIs */}
          {(kpiCount ?? 0) > 0 && (
            <Link href="/dashboard/kpi">
              <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {kpiCount} KPIs đang theo dõi
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cập nhật số liệu hàng tuần
                    </p>
                  </div>
                  <span className="text-sm text-primary font-semibold">
                    Xem →
                  </span>
                </CardContent>
              </Card>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/kpi">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="py-4 text-center space-y-1">
                  <span className="text-2xl">📈</span>
                  <p className="text-sm font-semibold">KPI Tracker</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/report">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="py-4 text-center space-y-1">
                  <span className="text-2xl">📄</span>
                  <p className="text-sm font-semibold">Báo cáo tháng</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Link href="/dashboard/discovery">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <span className="text-2xl">🔍</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Discovery Hub</p>
                  <p className="text-xs text-muted-foreground">
                    SWOT, Pain Mapper, Vision, Benchmark
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* State A: No X-Matrix — show discovery checklist */}
      {!hasXMatrix && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {completedCount === 0
                    ? 'Bắt đầu khám phá doanh nghiệp'
                    : allDiscoveryDone
                      ? 'Sẵn sàng tạo X-Matrix!'
                      : `Tiếp tục khám phá (${completedCount}/${DISCOVERY_STEPS.length})`}
                </CardTitle>
                <CardDescription className="mt-1">
                  {allDiscoveryDone
                    ? 'AI đã tổng hợp Discovery data — tạo X-Matrix ngay'
                    : 'Hoàn thành các bước để AI tạo chiến lược cho bạn'}
                </CardDescription>
              </div>
              <Badge variant={allDiscoveryDone ? 'default' : 'secondary'}>
                {completedCount}/{DISCOVERY_STEPS.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-2">
              {DISCOVERY_STEPS.map((step, idx) => {
                const done = completedSteps.has(step.key)
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 border px-4 py-3"
                  >
                    <div
                      className={
                        done
                          ? 'flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-primary-foreground text-xs'
                          : 'flex h-6 w-6 shrink-0 items-center justify-center border-2 border-muted-foreground/30 text-xs text-muted-foreground'
                      }
                    >
                      {done ? '✓' : idx + 1}
                    </div>
                    <span
                      className={
                        done
                          ? 'text-sm line-through text-muted-foreground'
                          : 'text-sm'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
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
              <Button className="w-full">
                {completedCount === 0
                  ? 'Bắt đầu khám phá →'
                  : allDiscoveryDone
                    ? 'Tạo X-Matrix →'
                    : 'Tiếp tục →'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

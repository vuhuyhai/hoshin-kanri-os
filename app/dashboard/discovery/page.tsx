import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { TrackMount } from '@/components/analytics/TrackMount'

const DISCOVERY_STEPS = [
  {
    key: 'x-ray',
    label: 'Business X-Ray',
    description: 'Chẩn đoán sức khỏe doanh nghiệp theo 7 trụ cột OPEX',
    href: '/x-ray',
    icon: '🔍',
    external: true,
  },
  {
    key: 'swot_coaching',
    label: 'Phân tích SWOT',
    description: 'AI Coach giúp phân tích 8Ms, Porter, PESTEL + nghiên cứu thị trường',
    href: '/dashboard/discovery/swot',
    icon: '🧠',
    external: false,
  },
  {
    key: 'pain_mapper',
    label: 'Pain → Goal Mapper',
    description: 'Chuyển đổi vấn đề thực tế thành mục tiêu chiến lược Hoshin Kanri',
    href: '/dashboard/discovery/pain-mapper',
    icon: '🎯',
    external: false,
  },
  {
    key: 'vision',
    label: 'Vision Workshop',
    description: 'Xây dựng tầm nhìn và mục tiêu năm cho doanh nghiệp',
    href: '/dashboard/discovery/vision-workshop',
    icon: '🔭',
    external: false,
  },
  {
    key: 'benchmark',
    label: 'KPI Benchmark Library',
    description: 'Tham khảo KPI theo ngành với benchmark Việt Nam',
    href: '/dashboard/discovery/benchmark',
    icon: '📊',
    external: false,
  },
  {
    key: 'synthesis',
    label: 'AI Strategy Synthesis',
    description: 'Tổng hợp toàn bộ Discovery → X-Matrix pre-fill 70%',
    href: '/dashboard/discovery/synthesis',
    icon: '🧬',
    external: false,
  },
] as const

function getScoreLabel(score: number): string {
  if (score <= 25) return 'Nguy hiểm'
  if (score <= 50) return 'Yếu'
  if (score <= 75) return 'Trung bình'
  return 'Tốt'
}

// Status badge styles — KPI pastel bg + saturated strong border (M-Design-3b).
// Hue shifts vs Tailwind emerald/amber palette are intentional (brand alignment).
const BADGE_STYLE_DONE = {
  backgroundColor: 'var(--kpi-healthy)',
  color: 'var(--kpi-healthy-fg)',
  border: '1px solid var(--kpi-healthy-strong)',
} as const

const BADGE_STYLE_NEXT = {
  backgroundColor: 'var(--kpi-attention)',
  color: 'var(--kpi-attention-fg)',
  border: '1px solid var(--kpi-attention-strong)',
} as const

const BADGE_STYLE_LOCKED = {
  backgroundColor: 'var(--bg-muted)',
  color: 'var(--text-3)',
  border: '1px solid color-mix(in srgb, var(--text-3) 30%, transparent)',
} as const

interface XRayData {
  latestScore?: number
  latestLevel?: string
  completedAt?: string
  latestResultId?: string
}

type StepStatus = 'completed' | 'next' | 'locked'

export default async function DiscoveryPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('step_completed, data_json')

  const completedSteps = new Set(
    sessions?.map((s) => s.step_completed).filter(Boolean) ?? []
  )

  const completedCount = DISCOVERY_STEPS.filter((s) =>
    completedSteps.has(s.key)
  ).length

  // Extract X-Ray data from discovery session
  const xraySession = sessions?.find((s) => s.step_completed === 'x-ray')
  const xrayData = xraySession?.data_json as XRayData | null

  // Determine status for each step
  function getStepStatus(key: string, idx: number): StepStatus {
    if (completedSteps.has(key)) return 'completed'
    if (idx === 0 || completedSteps.has(DISCOVERY_STEPS[idx - 1].key)) return 'next'
    return 'locked'
  }

  // Find next uncompleted step
  const nextStep = DISCOVERY_STEPS.find((s) => !completedSteps.has(s.key))

  return (
    <div className="w-full min-h-full p-6 lg:p-8">
      <TrackMount event="discovery_start" properties={{ completedCount }} />
      {/* Page header */}
      <div className="mb-8 pb-6">
        <p className="overline mb-1">Discovery</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
          Khám phá doanh nghiệp
        </h1>
        <p className="font-body text-text-2 mt-1 text-base">
          Hoàn thành các bước để hiểu rõ doanh nghiệp trước khi lập chiến lược
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Discovery step cards — 2 col grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DISCOVERY_STEPS.map((step, idx) => {
              const status = getStepStatus(step.key, idx)
              const done = status === 'completed'
              const isNext = status === 'next'
              const isLocked = status === 'locked'

              // Special X-Ray card with score
              if (step.key === 'x-ray' && done && xrayData) {
                return (
                  <div
                    key={step.key}
                    className="bg-[var(--bg)] border border-border shadow-sm p-5 flex flex-col min-h-[160px] transition-all duration-150 hover:border-foreground hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{step.icon}</span>
                      <span
                        className="inline-flex items-center gap-1 font-display font-semibold text-[11px] uppercase tracking-wider px-2.5 py-0.5"
                        style={BADGE_STYLE_DONE}
                      >
                        ✓ Hoàn thành
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                      {step.label}
                    </h3>
                    <p className="font-body text-sm text-text-3 mt-1">
                      Điểm: {xrayData.latestScore}/100 · {getScoreLabel(xrayData.latestScore ?? 0)}
                    </p>
                    {xrayData.completedAt && (
                      <p className="font-body text-xs text-text-3 mt-1">
                        Lần cuối: {new Date(xrayData.completedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    <div className="mt-auto pt-4 flex gap-2">
                      <Link href="/dashboard/discovery/xray-history" className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border text-muted-foreground bg-background hover:bg-muted"
                        >
                          Xem báo cáo
                        </Button>
                      </Link>
                      <Link href="/x-ray" target="_blank" className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border text-muted-foreground bg-background hover:bg-muted text-xs"
                        >
                          Chạy lại →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={step.key}
                  className={`bg-[var(--bg)] border shadow-sm p-5 flex flex-col min-h-[160px] transition-all duration-150 ${
                    isNext
                      ? 'border-foreground hover:shadow-md'
                      : 'border-border hover:border-foreground hover:shadow-md'
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{step.icon}</span>
                    {done && (
                      <span
                        className="inline-flex items-center gap-1 font-display font-semibold text-[11px] uppercase tracking-wider px-2.5 py-0.5"
                        style={BADGE_STYLE_DONE}
                      >
                        ✓ Hoàn thành
                      </span>
                    )}
                    {isNext && (
                      <span
                        className="inline-flex items-center gap-1 font-display font-semibold text-[11px] uppercase tracking-wider px-2.5 py-0.5"
                        style={BADGE_STYLE_NEXT}
                      >
                        → Tiếp theo
                      </span>
                    )}
                    {isLocked && (
                      <span
                        className="inline-flex items-center gap-1 font-display font-semibold text-[11px] uppercase tracking-wider px-2.5 py-0.5"
                        style={BADGE_STYLE_LOCKED}
                      >
                        Chưa bắt đầu
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                    {step.label}
                  </h3>
                  <p className="font-body text-sm text-text-3 mt-1 flex-1">
                    {step.description}
                  </p>
                  <div className="mt-4">
                    <Link
                      href={step.href}
                      target={step.external ? '_blank' : undefined}
                    >
                      {done ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-border text-muted-foreground bg-background hover:bg-muted"
                        >
                          Xem lại
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full bg-ink text-bg-warm hover:bg-ink/90 font-display font-bold uppercase text-xs py-2 tracking-wider"
                          disabled={isLocked}
                        >
                          Bắt đầu →
                        </Button>
                      )}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Progress summary — sticky */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--bg)] border border-border shadow-sm p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground mb-4">
              Tiến độ khám phá
            </h3>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="h-3 w-full border border-border bg-muted">
                <div
                  className="h-full bg-accent-brand transition-all duration-500"
                  style={{
                    width: `${(completedCount / DISCOVERY_STEPS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="font-body text-sm text-text-2 mt-2">
                {completedCount}/{DISCOVERY_STEPS.length} bước
              </p>
            </div>

            {/* Step status list */}
            <div className="space-y-2.5 mb-6">
              {DISCOVERY_STEPS.map((step, idx) => {
                const status = getStepStatus(step.key, idx)
                const done = status === 'completed'
                const isLocked = status === 'locked'
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-2 font-body text-sm"
                  >
                    {done ? (
                      <span style={{ color: 'var(--score-good)' }}>✓</span>
                    ) : isLocked ? (
                      <span className="text-muted-foreground/50">○</span>
                    ) : (
                      <span>⏳</span>
                    )}
                    <span
                      className={
                        done
                          ? 'text-muted-foreground line-through'
                          : isLocked
                            ? 'text-muted-foreground/50'
                            : 'text-foreground font-medium'
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Next step CTA */}
            {nextStep && (
              <div className="border-t border-border pt-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-widest text-text-3 mb-2">
                  Bước tiếp theo
                </p>
                <p className="font-display text-sm font-bold text-ink mb-3">
                  {nextStep.label}
                </p>
                <Link
                  href={nextStep.href}
                  target={nextStep.external ? '_blank' : undefined}
                >
                  <Button variant="ghost" className="w-full bg-ink text-bg-warm hover:bg-ink/90 font-display font-bold uppercase text-xs py-2 tracking-wider">
                    Tiếp tục →
                  </Button>
                </Link>
              </div>
            )}

            {completedCount === DISCOVERY_STEPS.length && (
              <div className="border-t border-border pt-4">
                <p className="font-display text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--score-good)' }}>
                  Hoàn thành!
                </p>
                <Link href="/dashboard/x-matrix/new">
                  <Button className="btn-brutal-primary w-full text-xs py-2">
                    Tạo X-Matrix →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { XMatrixPrefill, PrefillHoshin } from '@/lib/discovery/types'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================
type SynthesisStatus = 'running' | 'done' | 'missing' | 'error'

interface MissingData {
  vision: boolean
  painMapper: boolean
}

// ============================================================
// PROGRESS MESSAGES
// ============================================================
const PROGRESS_MESSAGES = [
  'Đang đọc kết quả SWOT của bạn...',
  'Đang phân tích Hoshin candidates từ Pain Mapper...',
  'Đang tổng hợp Vision & Year Goals...',
  'AI đang xây dựng X-Matrix draft...',
  'Hoàn thiện Initiatives và KPI suggestions...',
]

// ============================================================
// SUB: Loading state
// ============================================================
function SynthesisLoading({ message }: { message: string }) {
  return (
    <div className="text-center space-y-8 py-16">
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-3xl">
          🧠
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">AI đang tổng hợp chiến lược</h2>
        <p className="text-sm text-muted-foreground min-h-[20px] transition-all">
          {message}
        </p>
      </div>

      <div className="w-full max-w-xs mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>

      <p className="text-xs text-muted-foreground">
        Thường mất 20–40 giây · Đừng tắt trang này
      </p>

      <style>{`
        @keyframes loading {
          0%   { transform: translateX(-100%); width: 40%; }
          50%  { transform: translateX(60%);  width: 60%; }
          100% { transform: translateX(200%); width: 40%; }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// SUB: Missing data
// ============================================================
function SynthesisMissing({
  missing,
  onRetry,
}: {
  missing: MissingData
  onRetry: () => void
}) {
  const router = useRouter()
  const missingSteps: Array<{ label: string; href: string }> = []
  if (missing.painMapper)
    missingSteps.push({
      label: 'Pain → Goal Mapper',
      href: '/dashboard/discovery/pain-mapper',
    })
  if (missing.vision)
    missingSteps.push({
      label: 'Vision Workshop',
      href: '/dashboard/discovery/vision-workshop',
    })

  return (
    <div className="text-center space-y-6 py-12">
      <div className="text-5xl">⚠️</div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Cần hoàn thành thêm</h2>
        <p className="text-sm text-muted-foreground">
          AI Synthesis cần dữ liệu từ các bước sau:
        </p>
      </div>

      <div className="space-y-2 text-left max-w-xs mx-auto">
        {missingSteps.map((step) => (
          <button
            key={step.href}
            onClick={() => router.push(step.href)}
            className="w-full flex items-center gap-3 p-3 border border-destructive/40 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <span className="text-destructive text-lg">✕</span>
            <span className="text-sm font-medium text-destructive">
              {step.label}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              → Làm ngay
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 justify-center pt-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
        >
          ← Discovery Hub
        </Button>
        <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
          Thử lại
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// SUB: Generic error
// ============================================================
function SynthesisError({ onRetry }: { onRetry: () => void }) {
  const router = useRouter()
  return (
    <div className="text-center space-y-6 py-12">
      <div className="text-5xl">💥</div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
        <p className="text-sm text-muted-foreground">
          Không thể kết nối AI. Thử lại hoặc về Discovery Hub.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
        >
          ← Discovery Hub
        </Button>
        <Button onClick={onRetry} className="bg-primary hover:bg-primary/90">
          Thử lại
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// SUB: Result display
// ============================================================
function SynthesisResult({ prefill }: { prefill: XMatrixPrefill }) {
  const router = useRouter()

  const totalInits = prefill.initiatives?.length ?? 0
  const totalKpis = prefill.kpiSuggestions?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="text-center space-y-3">
        <div className="text-5xl">🎉</div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Discovery hoàn thành!</h2>
          <p className="text-sm text-muted-foreground">
            X-Matrix đã được pre-fill{' '}
            <span className="text-primary font-semibold">
              {prefill.discoveryCompleteness}%
            </span>
          </p>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-4 pt-1">
          {[
            {
              label: 'Hoshins',
              value: prefill.hoshinCandidates?.length ?? 0,
            },
            { label: 'Initiatives', value: totalInits },
            { label: 'KPI gợi ý', value: totalKpis },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision preview */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Vision
        </p>
        <p className="font-semibold leading-relaxed">{prefill.vision}</p>
        {(prefill.yearGoals ?? []).filter(Boolean).length > 0 && (
          <div className="space-y-1 pt-1 border-t border-primary/10">
            {prefill.yearGoals.filter(Boolean).map((goal, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {idx + 1}. {goal}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Hoshin candidates */}
      {(prefill.hoshinCandidates ?? []).length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Hoshin Candidates ({prefill.hoshinCandidates.length})
          </h3>

          {prefill.hoshinCandidates.map(
            (hoshin: PrefillHoshin, idx: number) => {
              const hoshinInits = (prefill.initiatives ?? []).filter(
                (i) => i.hoshinId === hoshin.id
              ).length
              const hoshinKpis = (prefill.kpiSuggestions ?? []).filter(
                (k) => k.hoshinId === hoshin.id
              ).length

              return (
                <div
                  key={hoshin.id}
                  className="border rounded-lg p-4 space-y-2 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-snug flex-1">
                      {idx + 1}. {hoshin.title}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      {hoshinInits > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {hoshinInits} init
                        </Badge>
                      )}
                      {hoshinKpis > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {hoshinKpis} KPI
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn('text-xs', {
                          'border-orange-300 text-orange-600 dark:text-orange-400':
                            hoshin.sourceType === 'pain',
                          'border-blue-300 text-blue-600 dark:text-blue-400':
                            hoshin.sourceType === 'swot',
                          'border-red-300 text-red-600 dark:text-red-400':
                            hoshin.sourceType === 'ai',
                        })}
                      >
                        {hoshin.sourceType === 'pain' && 'Pain'}
                        {hoshin.sourceType === 'swot' && 'SWOT'}
                        {hoshin.sourceType === 'ai' && 'AI'}
                      </Badge>
                    </div>
                  </div>
                  {hoshin.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {hoshin.description}
                    </p>
                  )}
                </div>
              )
            }
          )}
        </div>
      )}

      {/* Warnings */}
      {(prefill.warnings ?? []).length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Lưu ý
          </p>
          {prefill.warnings.map((w, idx) => (
            <p
              key={idx}
              className="text-xs text-yellow-700 dark:text-yellow-300"
            >
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={() => router.push('/dashboard/x-matrix/new')}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-base"
        >
          Vào X-Matrix Builder →
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          X-Matrix đã được pre-fill · Bạn chỉ cần review và confirm
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/discovery')}
          className="w-full text-muted-foreground"
        >
          ← Về Discovery Hub
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface SynthesisClientProps {
  orgId: string
  orgContext: {
    orgName: string
    industry: string
    city: string
    headcount: string
  }
}

export function SynthesisClient({ orgId, orgContext }: SynthesisClientProps) {
  const [status, setStatus] = useState<SynthesisStatus>('running')
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0])
  const [prefill, setPrefill] = useState<XMatrixPrefill | null>(null)
  const [missingData, setMissingData] = useState<MissingData>({
    vision: false,
    painMapper: false,
  })
  const started = useRef(false)

  // Auto-run on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true
      runSynthesis()
    }
  }, [])

  // Cycle progress messages while running
  useEffect(() => {
    if (status !== 'running') return
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % PROGRESS_MESSAGES.length
      setProgressMsg(PROGRESS_MESSAGES[idx])
    }, 4000)
    return () => clearInterval(interval)
  }, [status])

  const runSynthesis = async () => {
    setStatus('running')
    setProgressMsg(PROGRESS_MESSAGES[0])

    // Read selected KPIs from localStorage (set by Benchmark Library)
    let selectedKpis: unknown[] = []
    try {
      const raw = localStorage.getItem('hoshin_selected_kpis')
      if (raw) selectedKpis = JSON.parse(raw)
    } catch {
      // Ignore — synthesis works without KPI suggestions
    }

    try {
      const response = await fetch('/api/discovery/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          orgContext,
          selectedKpis,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.missing) {
          setMissingData({
            vision: data.missing.vision ?? false,
            painMapper: data.missing.painMapper ?? false,
          })
          setStatus('missing')
          return
        }
        throw new Error(data.error ?? 'Synthesis failed')
      }

      setPrefill(data.prefill)
      setStatus('done')

      // Clear localStorage after success
      try {
        localStorage.removeItem('hoshin_selected_kpis')
      } catch {
        // Ignore
      }

      // Data warnings — SWOT or coaching missing
      const warnings = data.dataWarnings as string[] | undefined
      if (warnings && warnings.length > 0) {
        toast.warning(
          `Thiếu dữ liệu từ: ${warnings.join(', ')}. Kết quả có thể chưa đầy đủ.`,
          { duration: 6000 }
        )
      }

      // Save warning
      if (data.savedSuccessfully === false) {
        toast.error(
          'Không thể lưu kết quả. Vui lòng chụp màn hình trước khi rời trang.',
          { duration: 8000 }
        )
      } else {
        toast.success('Discovery hoàn thành! X-Matrix sẵn sàng.')
      }
    } catch (error) {
      console.error('Synthesis error:', error)
      setStatus('error')
      toast.error('Không thể tổng hợp. Thử lại.')
    }
  }

  if (status === 'running') {
    return <SynthesisLoading message={progressMsg} />
  }

  if (status === 'missing') {
    return <SynthesisMissing missing={missingData} onRetry={runSynthesis} />
  }

  if (status === 'error') {
    return <SynthesisError onRetry={runSynthesis} />
  }

  if (status === 'done' && prefill) {
    return <SynthesisResult prefill={prefill} />
  }

  return null
}

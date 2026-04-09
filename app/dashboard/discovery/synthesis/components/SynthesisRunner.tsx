'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { XMatrixPrefill } from '@/lib/discovery/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SynthesisRunnerProps {
  orgId: string
  orgContext: {
    orgName: string
    industry: string
    city: string
    headcount: string
  }
}

export function SynthesisRunner({ orgId, orgContext }: SynthesisRunnerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<
    'idle' | 'running' | 'done' | 'error'
  >('idle')
  const [prefill, setPrefill] = useState<XMatrixPrefill | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      runSynthesis()
    }
  }, [])

  const runSynthesis = async () => {
    setStatus('running')
    try {
      const response = await fetch('/api/discovery/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, orgContext }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Synthesis failed')
      }

      const { prefill: result } = await response.json()
      setPrefill(result)
      setStatus('done')
      toast.success('Discovery hoàn thành! X-Matrix sẵn sàng.')
    } catch (error) {
      setStatus('error')
      const msg =
        error instanceof Error ? error.message : 'Có lỗi xảy ra'
      toast.error(msg)
    }
  }

  if (status === 'running') {
    return (
      <div className="space-y-6 py-16 text-center">
        <div
          className="animate-spin text-6xl"
          style={{ animationDuration: '3s' }}
        >
          🧠
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            AI đang tổng hợp Discovery
          </h2>
          <p className="text-sm text-muted-foreground">
            Kết hợp SWOT + Pain Points + Vision + KPI benchmarks...
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Thường mất 30–60 giây
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 py-16 text-center">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-xl font-semibold">Có lỗi xảy ra</h2>
        <p className="text-sm text-muted-foreground">
          Đảm bảo đã hoàn thành Pain Mapper và Vision Workshop trước.
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/discovery')}
          >
            ← Discovery Hub
          </Button>
          <Button onClick={runSynthesis}>Thử lại</Button>
        </div>
      </div>
    )
  }

  if (status === 'done' && prefill) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="text-3xl">✅</div>
          <h2 className="text-xl font-semibold">
            Discovery Layer hoàn thành!
          </h2>
          <p className="text-sm text-muted-foreground">
            X-Matrix đã được pre-fill {prefill.discoveryCompleteness}%
          </p>
        </div>

        {prefill.warnings.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Lưu ý:
            </p>
            <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              {prefill.warnings.map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold">
            Vision: <span className="font-normal">{prefill.vision}</span>
          </h3>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              Hoshin Candidates ({prefill.hoshinCandidates.length})
            </h4>
            <div className="space-y-2">
              {prefill.hoshinCandidates.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-2 rounded-lg border p-3"
                >
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {h.sourceType}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{h.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              Initiatives ({prefill.initiatives.length})
            </h4>
            <div className="space-y-1">
              {prefill.initiatives.map((init) => (
                <div
                  key={init.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge variant="outline" className="text-xs">
                    {init.timeframe}
                  </Badge>
                  <span>{init.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              KPI Suggestions ({prefill.kpiSuggestions.length})
            </h4>
            <div className="space-y-1">
              {prefill.kpiSuggestions.map((kpi, i) => (
                <div key={i} className="text-sm">
                  {kpi.name} — {kpi.targetValue} {kpi.unit} ({kpi.frequency})
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/discovery')}
            className="flex-1"
          >
            ← Discovery Hub
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Vào X-Matrix Builder →
          </Button>
        </div>
      </div>
    )
  }

  return null
}

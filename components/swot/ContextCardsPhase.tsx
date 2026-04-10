'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type { ContextCard, OrgContext, CoachingSummary } from '@/lib/swot/types'

interface ContextCardsPhaseProps {
  orgContext: OrgContext
  summary: CoachingSummary | null
}

const CARD_TYPE_LABELS: Record<string, string> = {
  market_trend: 'Xu hướng',
  competitive_risk: 'Cạnh tranh',
  regulatory: 'Pháp lý',
  opportunity: 'Cơ hội',
}

const QUADRANT_CONFIG = {
  O: {
    label: 'Cơ Hội',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  T: {
    label: 'Thách Thức',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
} as const

export function ContextCardsPhase({
  orgContext,
  summary,
}: ContextCardsPhaseProps) {
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const setContextCards = useSwotStore((s) => s.setContextCards)
  const existingCards = useSwotStore((s) => s.evidence.contextCards)

  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>(
    existingCards.length > 0 ? 'complete' : 'loading'
  )
  const [cards, setCards] = useState<ContextCard[]>(existingCards)
  const started = useRef(existingCards.length > 0)

  // Auto-fetch on mount if no cards yet
  useEffect(() => {
    if (!started.current) {
      started.current = true
      loadContextCards()
    }
  }, [])

  const loadContextCards = async () => {
    setStatus('loading')
    try {
      const dummySummary = summary ?? {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      }
      const response = await fetch('/api/swot/context-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: dummySummary, orgContext }),
      })

      if (!response.ok) throw new Error('Context cards failed')
      const data = await response.json()

      const fetchedCards = data.cards ?? []
      setCards(fetchedCards)
      setContextCards(fetchedCards)
      setStatus('complete')
    } catch {
      setStatus('error')
      toast.error('Gặp lỗi khi phân tích bối cảnh.')
    }
  }

  const handleContinue = () => {
    setSwotPhase(3)
  }

  const handleSkip = () => {
    setContextCards([])
    setSwotPhase(3)
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-lg space-y-8 py-12 text-center">
        <div
          className="animate-spin text-6xl"
          style={{ animationDuration: '3s' }}
        >
          🌐
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            Đang phân tích bối cảnh thị trường
          </h2>
          <p className="text-sm text-muted-foreground">
            AI đang phân tích bối cảnh thị trường cho ngành của bạn...
          </p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="mx-auto h-24 animate-pulse rounded-lg bg-muted"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Thường mất 15–20 giây</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12 text-center">
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            Không thể phân tích bối cảnh
          </h2>
          <p className="text-sm text-muted-foreground">
            Bạn vẫn có thể tiếp tục — AI sẽ tổng hợp SWOT dựa trên thông tin
            từ coaching.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => {
              started.current = false
              loadContextCards()
            }}
          >
            Thử lại
          </Button>
          <Button onClick={handleSkip}>Tiếp tục không cần bối cảnh →</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => setSwotPhase(1)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Quay lại coaching
      </button>

      <div className="space-y-2 text-center">
        <div className="text-3xl">🌐</div>
        <h2 className="text-xl font-semibold">Bối cảnh thị trường</h2>
        <p className="text-sm text-muted-foreground">
          AI đã phân tích {cards.length} yếu tố bên ngoài liên quan đến doanh
          nghiệp của bạn. Xem qua trước khi tổng hợp SWOT.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const qConfig = QUADRANT_CONFIG[card.swot_quadrant]
          return (
            <div
              key={card.id}
              className={`space-y-2 rounded-lg border p-4 ${qConfig.bg} ${qConfig.border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug">
                  {card.title}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${qConfig.badge}`}
                >
                  {qConfig.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.insight}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {CARD_TYPE_LABELS[card.card_type] ?? card.card_type}
                </Badge>
                {card.relevance_score >= 0.8 && (
                  <span className="text-xs text-muted-foreground">
                    Độ liên quan cao
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={handleContinue} className="px-8">
          Tiếp tục →
        </Button>
      </div>
    </div>
  )
}

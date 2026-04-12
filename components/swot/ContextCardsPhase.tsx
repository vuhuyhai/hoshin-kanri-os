'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Globe, AlertTriangle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { ContextCardItem } from './ContextCardItem'
import type { ContextCard, OrgContext, CoachingSummary } from '@/lib/swot/types'

interface ContextCardsPhaseProps {
  orgContext: OrgContext
  summary: CoachingSummary | null
  /** Wizard callbacks. If omitted, falls back to useSwotStore.setSwotPhase. */
  onBack?: () => void
  onContinue?: () => void
}

export function ContextCardsPhase({ orgContext, summary, onBack, onContinue }: ContextCardsPhaseProps) {
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const setContextCards = useSwotStore((s) => s.setContextCards)
  const existingCards = useSwotStore((s) => s.evidence.contextCards)

  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>(
    existingCards.length > 0 ? 'complete' : 'loading'
  )
  const [cards, setCards] = useState<ContextCard[]>(existingCards)
  const started = useRef(existingCards.length > 0)

  const loadContextCards = async () => {
    setStatus('loading')
    try {
      const dummySummary =
        summary ?? { strengths: [], weaknesses: [], opportunities: [], threats: [] }
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

  useEffect(() => {
    if (!started.current) {
      started.current = true
      loadContextCards()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContinue = () => {
    if (onContinue) onContinue()
    else setSwotPhase(3)
  }
  const handleSkip = () => {
    setContextCards([])
    if (onContinue) onContinue()
    else setSwotPhase(3)
  }
  const handleBack = () => {
    if (onBack) onBack()
    else setSwotPhase(1)
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-lg py-12 text-center space-y-6">
        <div
          className="inline-flex items-center justify-center w-20 h-20 border-2 border-ink bg-white"
          style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
        >
          <Loader2 className="w-10 h-10 text-ink animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-xl uppercase text-ink">
            Đang phân tích bối cảnh thị trường
          </h2>
          <p className="font-body text-sm text-text-2">
            AI đang phân tích bối cảnh thị trường cho ngành của bạn...
          </p>
        </div>
        <p className="font-body text-xs text-text-3">Thường mất 15–20 giây</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg py-12 text-center space-y-6">
        <div
          className="inline-flex items-center justify-center w-20 h-20 border-2 border-ink bg-white"
          style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
        >
          <AlertTriangle className="w-10 h-10 text-[#c73937]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-xl uppercase text-ink">
            Không thể phân tích bối cảnh
          </h2>
          <p className="font-body text-sm text-text-2">
            Bạn vẫn có thể tiếp tục — AI sẽ tổng hợp SWOT dựa trên thông tin từ coaching.
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
          <Button onClick={handleSkip}>
            Tiếp tục không cần bối cảnh <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 font-body text-sm text-text-2 hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại coaching
      </button>

      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center justify-center w-14 h-14 border-2 border-ink bg-white"
          style={{ boxShadow: '3px 3px 0 #2C2B2B' }}
        >
          <Globe className="w-7 h-7 text-ink" />
        </div>
        <h2 className="font-display font-black text-xl uppercase text-ink">
          Bối cảnh thị trường
        </h2>
        <p className="font-body text-sm text-text-2">
          AI đã phân tích {cards.length} yếu tố bên ngoài liên quan đến doanh nghiệp của bạn. Xem qua trước khi tổng hợp SWOT.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <ContextCardItem key={card.id} card={card} />
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={handleContinue} className="px-8">
          Tiếp tục <ArrowRight className="ml-1 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

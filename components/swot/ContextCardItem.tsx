'use client'

import type { ContextCard } from '@/lib/swot/types'

const CARD_TYPE_LABELS: Record<string, string> = {
  market_trend: 'Xu hướng',
  competitive_risk: 'Cạnh tranh',
  regulatory: 'Pháp lý',
  opportunity: 'Cơ hội',
}

const QUADRANT_CONFIG = {
  O: { label: 'Cơ Hội', accent: '#2563eb' },
  T: { label: 'Thách Thức', accent: '#c73937' },
} as const

interface ContextCardItemProps {
  card: ContextCard
}

export function ContextCardItem({ card }: ContextCardItemProps) {
  const qConfig = QUADRANT_CONFIG[card.swot_quadrant]
  const typeLabel = CARD_TYPE_LABELS[card.card_type] ?? card.card_type

  return (
    <div
      className="bg-white border-2 border-ink p-4 space-y-2"
      style={{
        boxShadow: '4px 4px 0 #2C2B2B',
        borderLeft: `8px solid ${qConfig.accent}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-sm leading-snug text-ink">
          {card.title}
        </h3>
        <span
          className="shrink-0 font-display font-bold text-[10px] uppercase px-2 py-0.5 border-2 border-ink text-white"
          style={{ background: qConfig.accent }}
        >
          {qConfig.label}
        </span>
      </div>
      <p className="font-body text-sm leading-relaxed text-text-2">
        {card.insight}
      </p>
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-[10px] uppercase px-2 py-0.5 border-2 border-ink bg-white text-ink">
          {typeLabel}
        </span>
        {card.relevance_score >= 0.8 && (
          <span className="font-body text-xs text-text-3">Độ liên quan cao</span>
        )}
      </div>
    </div>
  )
}

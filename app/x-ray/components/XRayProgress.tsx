'use client'

import { PILLAR_ORDER, OPEX_PILLARS } from '@/lib/x-ray/questions'

interface XRayProgressProps {
  currentStep: number
}

const PILLAR_COLORS = [
  '#c73937', // lean
  '#D97706', // six_sigma
  '#2563EB', // workplace
  '#7C3AED', // value_chain
  '#EC4899', // cx
  '#059669', // value_innovation
  '#6366F1', // value_ai
]

export function XRayProgress({ currentStep }: XRayProgressProps) {
  const totalSteps = PILLAR_ORDER.length + 1 // 7 pillars + email
  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full space-y-2">
      <div className="h-2 w-full overflow-hidden border-2 border-ink bg-bg-muted-warm">
        <div
          className="h-full bg-accent-brand transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between font-body text-sm text-text-2">
        <span>
          {currentStep < PILLAR_ORDER.length
            ? `${OPEX_PILLARS[PILLAR_ORDER[currentStep]].icon} ${OPEX_PILLARS[PILLAR_ORDER[currentStep]].label}`
            : '📧 Nhận báo cáo'}
        </span>
        <span className="font-display text-xs font-semibold tabular-nums">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>

      <div className="mt-1 flex gap-1">
        {PILLAR_ORDER.map((pillar, idx) => (
          <div
            key={pillar}
            className="h-1.5 flex-1 transition-colors duration-300"
            style={{
              background:
                idx < currentStep
                  ? PILLAR_COLORS[idx]
                  : idx === currentStep
                    ? PILLAR_COLORS[idx] + '99'
                    : '#ECEAE6',
            }}
          />
        ))}
        <div
          className={`h-1.5 flex-1 transition-colors duration-300 ${
            currentStep >= PILLAR_ORDER.length ? 'bg-accent-brand/60' : 'bg-bg-muted-warm'
          }`}
        />
      </div>
    </div>
  )
}

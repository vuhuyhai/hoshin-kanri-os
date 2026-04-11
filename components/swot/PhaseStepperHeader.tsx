'use client'

import { Check } from 'lucide-react'
import { useSwotStore } from '@/lib/swot/swot-session-store'

const PHASES = [
  { number: 1, label: 'Khám phá' },
  { number: 2, label: 'Soi chiếu' },
  { number: 3, label: 'Tổng hợp' },
] as const

export function PhaseStepperHeader() {
  const swotPhase = useSwotStore((s) => s.swotPhase)
  const coaching = useSwotStore((s) => s.coaching)
  const evidence = useSwotStore((s) => s.evidence)
  const synthesis = useSwotStore((s) => s.synthesis)

  const phaseStatuses = {
    1: coaching.status,
    2: evidence.status,
    3: synthesis.status,
  }

  return (
    <div className="flex items-center gap-0 mb-6 max-w-md mx-auto">
      {PHASES.map((phase, index) => {
        const isDone = phaseStatuses[phase.number] === 'completed'
        const isActive = swotPhase === phase.number && !isDone
        const isInactive = !isDone && !isActive

        return (
          <div key={phase.number} className="contents">
            {/* Step node + label */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 flex items-center justify-center border-2 font-display font-bold text-sm',
                  isDone
                    ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                    : isActive
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--bg)] text-[var(--text-3)] border-[var(--ink)]/30',
                ].join(' ')}
              >
                {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : phase.number}
              </div>
              <span
                className={[
                  'font-display font-semibold text-[11px] uppercase tracking-wider mt-2 text-center',
                  isActive ? 'text-[var(--ink)]' : 'text-[var(--text-3)]',
                ].join(' ')}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector line (skip after last) */}
            {index < PHASES.length - 1 && (
              <div
                className={[
                  'flex-1 h-[2px] -mt-4',
                  isDone || isActive ? 'bg-[var(--ink)]' : 'bg-[var(--ink)]/20',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

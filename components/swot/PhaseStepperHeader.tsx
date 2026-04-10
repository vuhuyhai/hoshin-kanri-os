'use client'

import { useSwotStore } from '@/lib/swot/swot-session-store'

const PHASES = [
  { number: 1, label: 'Khám phá' },
  { number: 2, label: 'Bối cảnh' },
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
    <div className="flex items-center gap-0 w-full mb-8">
      {PHASES.map((phase, index) => {
        const isComplete = phaseStatuses[phase.number] === 'completed'
        const isCurrent = swotPhase === phase.number
        const isLocked = swotPhase < phase.number && !isComplete

        return (
          <div key={phase.number} className="flex items-center flex-1">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-8 h-8 border-2 flex items-center justify-center text-sm font-medium',
                  isComplete
                    ? 'bg-foreground border-foreground text-background'
                    : isCurrent
                      ? 'bg-background border-foreground text-foreground'
                      : 'bg-background border-foreground/30 text-foreground/30',
                ].join(' ')}
              >
                {isComplete ? '✓' : phase.number}
              </div>
              <span
                className={[
                  'text-xs whitespace-nowrap',
                  isCurrent
                    ? 'text-foreground font-medium'
                    : isComplete
                      ? 'text-foreground/70'
                      : 'text-foreground/40',
                ].join(' ')}
              >
                {phase.label}
              </span>
            </div>

            {/* Connector line (skip after last) */}
            {index < PHASES.length - 1 && (
              <div
                className={[
                  'flex-1 h-0.5 mx-2 mb-5',
                  isComplete ? 'bg-foreground' : 'bg-foreground/20',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

'use client'

import { PILLAR_ORDER } from '@/lib/x-ray/questions'

interface XRayProgressProps {
  currentStep: number
}

export function XRayProgress({ currentStep }: XRayProgressProps) {
  const totalSteps = PILLAR_ORDER.length + 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="sticky top-0 z-40 flex items-center gap-4 border-b-2 border-ink bg-bg-warm px-6 h-14">
      <div className="flex-1 h-3 border-2 border-ink bg-bg-muted-warm overflow-hidden">
        <div
          className="h-full bg-accent-brand transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-display font-bold text-sm text-ink tabular-nums">
        {currentStep + 1}/{totalSteps}
      </span>
    </div>
  )
}

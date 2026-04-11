'use client'

import { useSwotStore } from '@/lib/swot/swot-session-store'
import { PhaseStepperHeader } from './PhaseStepperHeader'
import { CoachingPhase } from './CoachingPhase'
import { ContextCardsPhase } from './ContextCardsPhase'
import { SynthesisPhase } from './SynthesisPhase'
import type { OrgContext } from '@/lib/swot/types'

interface SwotOrchestratorProps {
  orgContext: OrgContext
  userId: string
}

export function SwotOrchestrator({ orgContext, userId }: SwotOrchestratorProps) {
  const swotPhase = useSwotStore((s) => s.swotPhase)

  return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <PhaseStepperHeader />

      <div>
        {swotPhase === 1 && (
          <CoachingPhase orgContext={orgContext} userId={userId} />
        )}
        {swotPhase === 2 && (
          <ContextCardsPhase orgContext={orgContext} summary={null} />
        )}
        {swotPhase === 3 && <SynthesisPhase orgContext={orgContext} />}
      </div>
    </div>
  )
}

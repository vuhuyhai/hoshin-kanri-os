'use client'

import { useMemo } from 'react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { PhaseStepperHeader } from './PhaseStepperHeader'
import { CoachingPhase } from './CoachingPhase'
import { ContextCardsPhase } from './ContextCardsPhase'
import { SynthesisPhase } from './SynthesisPhase'
import type { OrgContext, CoachingSummary } from '@/lib/swot/types'

interface SwotOrchestratorProps {
  orgContext: OrgContext
  userId: string
}

export function SwotOrchestrator({ orgContext, userId }: SwotOrchestratorProps) {
  const swotPhase = useSwotStore((s) => s.swotPhase)
  const confirmedDraft = useSwotStore((s) => s.confirmedDraft)

  // Derive CoachingSummary from confirmedDraft for Phase 2
  const coachingSummary: CoachingSummary | null = useMemo(() => {
    if (!confirmedDraft) return null
    return {
      strengths: confirmedDraft.strengths.map((i) => ({
        source: i.frameworkSource as never,
        content: i.statement,
      })),
      weaknesses: confirmedDraft.weaknesses.map((i) => ({
        source: i.frameworkSource as never,
        content: i.statement,
      })),
      opportunities: confirmedDraft.opportunities.map((i) => ({
        source: i.frameworkSource as never,
        content: i.statement,
      })),
      threats: confirmedDraft.threats.map((i) => ({
        source: i.frameworkSource as never,
        content: i.statement,
      })),
    }
  }, [confirmedDraft])

  return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <PhaseStepperHeader />

      <div>
        {swotPhase === 1 && (
          <CoachingPhase orgContext={orgContext} userId={userId} />
        )}
        {swotPhase === 2 && (
          <ContextCardsPhase orgContext={orgContext} summary={coachingSummary} />
        )}
        {swotPhase === 3 && <SynthesisPhase orgContext={orgContext} />}
      </div>
    </div>
  )
}

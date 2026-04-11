'use client'

import { useMemo } from 'react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { PhaseStepperHeader } from './PhaseStepperHeader'
import { CoachingPhase } from './CoachingPhase'
import { ContextCardsPhase } from './ContextCardsPhase'
import { SynthesisPhase } from './SynthesisPhase'
import type { OrgContext, CoachingSummary } from '@/lib/swot/types'
import { TowsOrchestrator } from './TowsOrchestrator'
import type { TowsStrategyWithFactorsRecord } from '@/lib/swot/tows-types'

interface SwotOrchestratorProps {
  orgContext: OrgContext
  userId: string
  mode?: 'coaching' | 'tows'
  analysisId?: string
  orgId?: string
  onTowsComplete?: (strategies: TowsStrategyWithFactorsRecord[]) => void
}

export function SwotOrchestrator({ orgContext, userId, mode = 'coaching', analysisId, orgId, onTowsComplete }: SwotOrchestratorProps) {
  if (mode === 'tows') {
    if (!analysisId || !orgId) {
      return (
        <div style={{ padding: 24, border: '2px solid #c73937', color: '#c73937' }}>
          Lỗi: TowsOrchestrator cần analysisId và orgId
        </div>
      )
    }
    return (
      <TowsOrchestrator
        analysisId={analysisId}
        orgId={orgId}
        onComplete={onTowsComplete}
      />
    )
  }

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

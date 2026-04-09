'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type {
  SwotModuleState,
  SwotPhase,
  CoachingState,
  CoachingSummary,
  EvidenceItem,
  OrgContext,
} from '@/lib/swot/types'
import { Phase1Coaching } from './Phase1Coaching'
import { Phase2Evidence } from './Phase2Evidence'
import { Phase3Synthesis } from './Phase3Synthesis'
import { SwotResults } from './SwotResults'

interface SwotContainerProps {
  orgContext: OrgContext
}

const initialCoachingState: CoachingState = {
  messages: [],
  currentFramework: 'sw',
  isComplete: false,
  isLoading: false,
  summary: null,
}

const initialState: SwotModuleState = {
  phase: 'coaching',
  coaching: initialCoachingState,
  evidence: {
    batches: [],
    totalBatches: 4,
    completedBatches: 0,
    isComplete: false,
  },
  items: [],
  isSaved: false,
  sessionId: null,
}

const PHASE_STEPS: { key: SwotPhase; label: string }[] = [
  { key: 'coaching', label: 'AI Coaching' },
  { key: 'evidence', label: 'Nghiên cứu' },
  { key: 'synthesis', label: 'Tổng hợp' },
  { key: 'results', label: 'Kết quả' },
]

export function SwotContainer({ orgContext }: SwotContainerProps) {
  const [state, setState] = useState<SwotModuleState>(initialState)

  const extractSummary = async (
    messages: CoachingState['messages'],
    ctx: OrgContext
  ): Promise<CoachingSummary> => {
    try {
      const response = await fetch('/api/swot/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: 'user' as const,
              content:
                'Hãy tóm tắt toàn bộ thành JSON: { "strengths": [{"source": "M1_Man", "content": "..."}], "weaknesses": [...], "opportunities": [...], "threats": [...] }. Chỉ trả về JSON.',
            },
          ],
          orgContext: ctx,
          currentFramework: 'ot',
        }),
      })
      const data = await response.json()
      const clean = data.message.content
        .replace(/```json|```/g, '')
        .trim()
      return JSON.parse(clean)
    } catch {
      return { strengths: [], weaknesses: [], opportunities: [], threats: [] }
    }
  }

  const handleCoachingComplete = async () => {
    const summary = await extractSummary(
      state.coaching.messages,
      orgContext
    )
    setState((prev) => ({
      ...prev,
      phase: 'evidence',
      coaching: { ...prev.coaching, summary },
    }))
  }

  const handleEvidenceComplete = async (allEvidence: EvidenceItem[]) => {
    setState((prev) => ({ ...prev, phase: 'synthesis' }))
    await runSynthesis(state.coaching.summary!, allEvidence)
  }

  const runSynthesis = async (
    summary: CoachingSummary,
    evidenceItems: EvidenceItem[]
  ) => {
    try {
      const response = await fetch('/api/swot/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, evidenceItems, orgContext }),
      })

      if (!response.ok) throw new Error('Synthesis failed')
      const { items } = await response.json()

      setState((prev) => ({
        ...prev,
        phase: 'results',
        items,
        isSaved: true,
      }))
      toast.success(`SWOT hoàn thành! ${items.length} insights đã lưu.`)
    } catch {
      toast.error('Lỗi khi tổng hợp SWOT. Thử lại.')
      setState((prev) => ({ ...prev, phase: 'evidence' }))
    }
  }

  const currentPhaseIndex = PHASE_STEPS.findIndex(
    (s) => s.key === state.phase
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        {PHASE_STEPS.map((step, idx) => (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <div
              className={`flex-1 rounded-full px-2 py-1 text-center text-xs transition-colors ${
                idx < currentPhaseIndex
                  ? 'bg-primary text-primary-foreground'
                  : idx === currentPhaseIndex
                    ? 'bg-primary/20 font-medium text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.label}
            </div>
            {idx < PHASE_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-4 ${idx < currentPhaseIndex ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border">
        {state.phase === 'coaching' && (
          <Phase1Coaching
            orgContext={orgContext}
            state={state.coaching}
            onStateChange={(coaching) =>
              setState((prev) => ({ ...prev, coaching }))
            }
            onPhaseComplete={handleCoachingComplete}
          />
        )}

        {state.phase === 'evidence' && state.coaching.summary && (
          <div className="p-6">
            <Phase2Evidence
              summary={state.coaching.summary}
              orgContext={orgContext}
              onComplete={handleEvidenceComplete}
            />
          </div>
        )}

        {state.phase === 'synthesis' && (
          <div className="p-6">
            <Phase3Synthesis />
          </div>
        )}

        {state.phase === 'results' && (
          <div className="p-6">
            <SwotResults items={state.items} isSaved={state.isSaved} />
          </div>
        )}
      </div>
    </div>
  )
}

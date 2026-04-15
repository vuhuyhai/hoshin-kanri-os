'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { CoachingPhase } from '../CoachingPhase'
import { ContextCardsPhase } from '../ContextCardsPhase'
import { SynthesisPhase } from '../SynthesisPhase'
import { TowsOrchestrator } from '../TowsOrchestrator'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type { OrgContext, CoachingSummary } from '@/lib/swot/types'
import { trackCoachingCompleted } from '@/lib/analytics/events'

interface SwotWizardProps {
  orgContext: OrgContext
  userId: string
  analysisId: string
  orgId: string
}

type WizardStep = 1 | 2 | 3 | 4

const STEPS = [
  { num: 1 as const, label: 'Coaching' },
  { num: 2 as const, label: 'Bối cảnh' },
  { num: 3 as const, label: 'Tổng hợp' },
  { num: 4 as const, label: 'TOWS & Chiến lược' },
]

export function SwotWizard({ orgContext, userId, analysisId, orgId }: SwotWizardProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const confirmedDraft = useSwotStore((s) => s.confirmedDraft)
  const coachingSubStep = useSwotStore((s) => s.coachingWizard.step)
  const showSkipBanner = step === 1 && coachingSubStep === 'form'

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
    <div className="max-w-screen-xl mx-auto px-6 py-4">
      <div className="flex mb-6">
        {STEPS.map((s, i) => {
          const isActive = s.num === step
          const isCompleted = s.num < step
          let bg = 'white'
          let color = '#2C2B2B'
          let cursor = 'default'
          if (isActive) {
            bg = '#2C2B2B'
            color = 'white'
          }
          if (isCompleted) {
            bg = '#c73937'
            color = 'white'
            cursor = 'pointer'
          }
          return (
            <button
              key={s.num}
              onClick={() => isCompleted && setStep(s.num)}
              disabled={!isCompleted}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs md:text-sm font-display font-bold border-2 border-ink transition-colors disabled:cursor-default"
              style={{
                background: bg,
                color,
                cursor,
                borderRight: i < STEPS.length - 1 ? 'none' : undefined,
                boxShadow: isActive ? '4px 4px 0 #2C2B2B' : 'none',
              }}
            >
              <span
                className="size-5 flex items-center justify-center border-2 text-[11px] font-bold"
                style={{
                  borderColor: color,
                  background: isCompleted ? 'white' : 'transparent',
                  color: isCompleted ? '#c73937' : color,
                }}
              >
                {isCompleted ? '✓' : s.num}
              </span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          )
        })}
      </div>

      {showSkipBanner && (
        <div
          className="mb-4 border-2 border-ink bg-white p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
          style={{ boxShadow: '3px 3px 0 #2C2B2B' }}
        >
          <p className="font-body text-sm text-text-2">
            <span className="font-display font-bold text-ink">Đã biết SWOT rồi?</span>{' '}
            Bỏ qua coaching + bối cảnh, nhập thẳng vào TOWS matrix.
          </p>
          <button
            onClick={() => setStep(4)}
            className="shrink-0 font-display font-bold text-xs uppercase border-2 border-ink px-3 py-1.5 bg-[#c73937] text-white hover:bg-[#9e1f1e] transition-colors inline-flex items-center gap-1"
            style={{ boxShadow: '2px 2px 0 #2C2B2B' }}
          >
            Bỏ qua coaching <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div>
        {step === 1 && (
          <CoachingPhase
            orgContext={orgContext}
            userId={userId}
            analysisId={analysisId}
            onComplete={() => {
              trackCoachingCompleted({
                strengthsCount: confirmedDraft?.strengths.length ?? 0,
                weaknessesCount: confirmedDraft?.weaknesses.length ?? 0,
                opportunitiesCount: confirmedDraft?.opportunities.length ?? 0,
                threatsCount: confirmedDraft?.threats.length ?? 0,
              })
              setStep(2)
            }}
          />
        )}
        {step === 2 && (
          <ContextCardsPhase
            orgContext={orgContext}
            summary={coachingSummary}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <SynthesisPhase
            orgContext={orgContext}
            analysisId={analysisId}
            onComplete={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <TowsOrchestrator
            analysisId={analysisId}
            orgId={orgId}
            onComplete={(strategies) => {
              toast.success(`${strategies.length} chiến lược đã sẵn sàng cho X-Matrix`)
            }}
          />
        )}
      </div>
    </div>
  )
}

'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { saveCoachingDraftToFactors, persistWizardStep } from '@/lib/swot/coaching-db'
import { SwotContextForm } from './SwotContextForm'
import { SwotLoadingState } from './SwotLoadingState'
import { SwotDraftBoard } from './SwotDraftBoard'
import type { OrgContext } from '@/lib/swot/types'
import type { SwotContextInput, SwotDraft, QuadrantKey } from '@/lib/swot/coaching-types'
import { postJson } from '@/lib/http/fetch-json'

interface CoachingPhaseProps {
  orgContext: OrgContext
  userId: string
  analysisId: string
  /** If provided, called after confirm (wizard flow). Otherwise falls back to setSwotPhase(2). */
  onComplete?: () => void
}

export function CoachingPhase({ orgContext, userId, analysisId, onComplete }: CoachingPhaseProps) {
  const step = useSwotStore((s) => s.coachingWizard.step)
  const contextInput = useSwotStore((s) => s.coachingWizard.contextInput)
  const draft = useSwotStore((s) => s.coachingWizard.draft)
  const setStep = useSwotStore((s) => s.setCoachingStep)
  const setContextInput = useSwotStore((s) => s.setCoachingContextInput)
  const setDraft = useSwotStore((s) => s.setCoachingDraft)
  const updateDraftItem = useSwotStore((s) => s.updateCoachingDraftItem)
  const addDraftItem = useSwotStore((s) => s.addCoachingDraftItem)
  const removeDraftItem = useSwotStore((s) => s.removeCoachingDraftItem)
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const setConfirmedDraft = useSwotStore((s) => s.setConfirmedDraft)

  const orgProfile = {
    name: orgContext.orgName,
    industry: orgContext.industry,
    headcount: orgContext.headcount,
    city: orgContext.city,
  }

  const handleFormSubmit = useCallback(
    async (input: SwotContextInput) => {
      setContextInput(input)
      setStep('loading')

      try {
        const draftData = await postJson<SwotDraft>(
          '/api/swot/coaching-draft',
          input,
        )
        setDraft(draftData)
        setStep('review')
      } catch (err) {
        console.error('[CoachingPhase] coaching-draft failed:', err)
        toast.error(err instanceof Error ? err.message : 'Lỗi kết nối AI. Thử lại.')
        setStep('form')
      }
    },
    [setContextInput, setStep, setDraft]
  )

  const handleSaveDraft = useCallback(async () => {
    if (!draft) return
    try {
      await saveCoachingDraftToFactors(analysisId, orgContext.orgId, draft)
      toast.success('Đã lưu nháp SWOT')
    } catch (err) {
      console.error('[CoachingPhase] saveCoachingDraftToFactors error:', err)
      toast.error('Không thể lưu nháp. Thử lại.')
    }
  }, [draft, analysisId, orgContext.orgId])

  const handleConfirm = useCallback(async () => {
    await handleSaveDraft()
    if (draft) {
      setConfirmedDraft(draft)
      try {
        await persistWizardStep(orgContext.orgId, userId, 'swot_wizard_step_1')
      } catch (err) {
        console.error('[CoachingPhase] persistWizardStep error:', err)
      }
    }
    setStep('confirmed')
    if (onComplete) {
      onComplete()
    } else {
      setSwotPhase(2)
    }
  }, [
    handleSaveDraft,
    draft,
    setConfirmedDraft,
    setStep,
    setSwotPhase,
    orgContext.orgId,
    userId,
    onComplete,
  ])

  if (step === 'form') {
    return (
      <div className="py-4">
        <SwotContextForm
          orgProfile={orgProfile}
          onSubmit={handleFormSubmit}
          isLoading={false}
        />
      </div>
    )
  }

  if (step === 'loading' && contextInput) {
    return <SwotLoadingState selectedFrameworks={contextInput.selectedFrameworks} />
  }

  if (step === 'review' && draft) {
    return (
      <div className="py-4">
        <SwotDraftBoard
          draft={draft}
          onUpdateItem={(q: QuadrantKey, id: string, stmt: string) =>
            updateDraftItem(q, id, stmt)
          }
          onAddItem={(q: QuadrantKey) => addDraftItem(q)}
          onRemoveItem={(q: QuadrantKey, id: string) => removeDraftItem(q, id)}
          onSaveDraft={handleSaveDraft}
          onConfirm={handleConfirm}
          orgId={orgContext.orgId}
        />
      </div>
    )
  }

  return (
    <div className="py-4">
      <SwotContextForm
        orgProfile={orgProfile}
        onSubmit={handleFormSubmit}
        isLoading={false}
      />
    </div>
  )
}

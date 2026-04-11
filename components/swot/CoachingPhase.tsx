'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useSwotCoachingStore } from '@/lib/swot/coaching-store'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { SwotContextForm } from './SwotContextForm'
import { SwotLoadingState } from './SwotLoadingState'
import { SwotDraftBoard } from './SwotDraftBoard'
import type { OrgContext } from '@/lib/swot/types'
import type { Json } from '@/lib/supabase/types'
import type { SwotContextInput, SwotDraft, QuadrantKey } from '@/lib/swot/coaching-types'

interface CoachingPhaseProps {
  orgContext: OrgContext
  userId: string
}

export function CoachingPhase({ orgContext, userId }: CoachingPhaseProps) {
  const step = useSwotCoachingStore((s) => s.step)
  const contextInput = useSwotCoachingStore((s) => s.contextInput)
  const draft = useSwotCoachingStore((s) => s.draft)
  const setStep = useSwotCoachingStore((s) => s.setStep)
  const setContextInput = useSwotCoachingStore((s) => s.setContextInput)
  const setDraft = useSwotCoachingStore((s) => s.setDraft)
  const updateDraftItem = useSwotCoachingStore((s) => s.updateDraftItem)
  const addDraftItem = useSwotCoachingStore((s) => s.addDraftItem)
  const removeDraftItem = useSwotCoachingStore((s) => s.removeDraftItem)
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const setConfirmedDraft = useSwotStore((s) => s.setConfirmedDraft)

  const orgProfile = {
    name: orgContext.orgName,
    industry: orgContext.industry,
    headcount: orgContext.headcount,
    city: orgContext.city,
  }

  // ─── Form submit → call AI ─────────────────────────────────
  const handleFormSubmit = useCallback(
    async (input: SwotContextInput) => {
      setContextInput(input)
      setStep('loading')

      try {
        const res = await fetch('/api/swot/coaching-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(
            (err as { error?: string }).error ||
              'Lỗi kết nối AI'
          )
        }

        const draftData: SwotDraft = await res.json()
        setDraft(draftData)
        setStep('review')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Lỗi kết nối AI. Thử lại.'
        )
        setStep('form')
      }
    },
    [setContextInput, setStep, setDraft]
  )

  // ─── Save draft to Supabase ────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!draft) return
    try {
      const supabase = createClient()
      // Delete existing draft rows for this org
      await supabase
        .from('swot_analyses')
        .delete()
        .eq('org_id', orgContext.orgId)
        .eq('quadrant', 'draft')

      const rows = (['strengths', 'weaknesses', 'opportunities', 'threats'] as const)
        .flatMap((q) =>
          draft[q].map((item) => ({
            org_id: orgContext.orgId,
            quadrant: 'draft' as string,
            framework_source: item.frameworkSource as string,
            statement: item.statement,
            evidence_json: {
              quadrant: q,
              rationale: item.rationale,
              confidence: item.confidence,
              isUserAdded: item.isUserAdded,
              draftItemId: item.id,
            } as unknown as Json,
          }))
        )

      if (rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('swot_analyses') as any).insert(rows)
      }

      toast.success('Đã lưu nháp SWOT')
    } catch {
      toast.error('Không thể lưu nháp. Thử lại.')
    }
  }, [draft, orgContext.orgId])

  // ─── Confirm → persist draft to DB + advance to Phase 2 ───
  const handleConfirm = useCallback(async () => {
    await handleSaveDraft()
    if (draft) {
      setConfirmedDraft(draft)
      // Persist confirmedDraft to discovery_sessions for cross-session recovery
      try {
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          await supabase.from('discovery_sessions').upsert({
            org_id: orgContext.orgId,
            user_id: currentUser.id,
            step_completed: 'swot_coaching_draft',
            data_json: { draft, savedAt: new Date().toISOString() } as unknown as Json,
          }, { onConflict: 'org_id,step_completed' } as never)
        }
      } catch (err) {
        console.error('[CoachingPhase] persist draft error:', err)
      }
    }
    setStep('confirmed')
    setSwotPhase(2)
  }, [handleSaveDraft, draft, setConfirmedDraft, setStep, setSwotPhase, orgContext.orgId])

  // ─── Render by step ────────────────────────────────────────

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
          onRemoveItem={(q: QuadrantKey, id: string) =>
            removeDraftItem(q, id)
          }
          onSaveDraft={handleSaveDraft}
          onConfirm={handleConfirm}
          orgId={orgContext.orgId}
        />
      </div>
    )
  }

  // Fallback — should not happen, reset to form
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

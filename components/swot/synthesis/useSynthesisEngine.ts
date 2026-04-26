'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { storeItemsToOutput } from '@/lib/swot/synthesis-helpers'
import { fetchRecoveredDraft, callSynthesisAPI } from '@/lib/swot/synthesis-db'
import { materializeSynthesisToFactors } from '@/lib/swot/factor-materialize'
import type {
  OrgContext,
  SwotQuadrant,
  SwotSynthesisOutput,
  SwotItem,
} from '@/lib/swot/types'

interface EngineOptions { onComplete?: () => void | Promise<void> }

export function useSynthesisEngine(orgContext: OrgContext, analysisId: string, options?: EngineOptions) {
  const router = useRouter()
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const contextCards = useSwotStore((s) => s.evidence.contextCards)
  const confirmedDraft = useSwotStore((s) => s.confirmedDraft)
  const setConfirmedDraft = useSwotStore((s) => s.setConfirmedDraft)
  const setSynthesisItems = useSwotStore((s) => s.setSynthesisItems)
  const completeSynthesis = useSwotStore((s) => s.completeSynthesis)
  const synthesisStatus = useSwotStore((s) => s.synthesis.status)
  const existingItems = useSwotStore((s) => s.synthesis.items)

  const hasCachedSynthesis =
    synthesisStatus === 'completed' && existingItems.length > 0

  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>(
    hasCachedSynthesis ? 'complete' : 'loading'
  )
  const [synthesis, setSynthesis] = useState<SwotSynthesisOutput | null>(
    hasCachedSynthesis ? storeItemsToOutput(existingItems) : null
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const started = useRef(hasCachedSynthesis)

  const runSynthesis = useCallback(async () => {
    setStatus('loading')
    if (!confirmedDraft) {
      toast.error('Chưa có dữ liệu coaching. Quay lại bước 1.')
      setStatus('error')
      return
    }
    try {
      const output = await callSynthesisAPI(orgContext.orgId, confirmedDraft, contextCards)
      setSynthesis(output)
      setStatus('complete')
    } catch (err) {
      setStatus('error')
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('Tổng hợp SWOT mất quá lâu (>58s). Vui lòng thử lại.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Lỗi khi tổng hợp SWOT. Thử lại.')
      }
    }
  }, [confirmedDraft, contextCards, orgContext.orgId])

  useEffect(() => {
    if (started.current) return

    if (confirmedDraft) {
      started.current = true
      runSynthesis()
      return
    }

    let cancelled = false
    setIsRecovering(true)
    fetchRecoveredDraft(orgContext.orgId, analysisId)
      .then((recovered) => {
        if (cancelled || started.current) return
        if (recovered) {
          setConfirmedDraft(recovered)
        } else {
          started.current = true
          setStatus('error')
        }
      })
      .finally(() => {
        if (!cancelled) setIsRecovering(false)
      })

    return () => {
      cancelled = true
    }
  }, [confirmedDraft, orgContext.orgId, analysisId, runSynthesis, setConfirmedDraft])

  const handleDeleteItem = useCallback((quadrant: SwotQuadrant, itemId: string) => {
    setSynthesis((prev) =>
      prev
        ? { ...prev, [quadrant]: prev[quadrant].filter((i) => i.id !== itemId) }
        : prev
    )
  }, [])

  const handleStartEdit = useCallback((item: SwotItem) => {
    setEditingId(item.id)
    setEditText(item.statement)
  }, [])

  const handleSaveEdit = useCallback(
    (quadrant: SwotQuadrant) => {
      setSynthesis((prev) => {
        if (!prev || !editingId) return prev
        return {
          ...prev,
          [quadrant]: prev[quadrant].map((i) =>
            i.id === editingId ? { ...i, statement: editText } : i
          ),
        }
      })
      setEditingId(null)
      setEditText('')
    },
    [editingId, editText]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleSaveAndContinue = useCallback(async () => {
    if (!synthesis) return
    setIsSaving(true)
    try {
      const storeItems = (['S', 'W', 'O', 'T'] as const).flatMap((q) =>
        synthesis[q].map((item) => ({
          id: item.id,
          category: q as import('@/lib/swot/swot-session-store').SwotCategory,
          statement: item.statement,
          evidence: { ceoInput: [], webSources: [] },
          implication: item.implication,
          rootCause: '',
          priority: 1 as const,
        }))
      )
      setSynthesisItems(storeItems)
      completeSynthesis()

      if (options?.onComplete) {
        // Wizard flow: persist synthesized items to swot_factors, then advance step
        await materializeSynthesisToFactors(analysisId, orgContext.orgId, synthesis)
        toast.success('SWOT đã lưu. Sang bước TOWS.')
        await options.onComplete()
      } else {
        // Legacy flow: push to strategy page
        toast.success('SWOT đã lưu. Chuyển sang Strategy.')
        router.push('/dashboard/discovery/swot/strategy')
      }
    } catch {
      toast.error('Không thể lưu. Thử lại.')
    } finally {
      setIsSaving(false)
    }
  }, [synthesis, setSynthesisItems, completeSynthesis, router, options, analysisId, orgContext.orgId])

  const retryFromError = useCallback(() => {
    started.current = false
    runSynthesis()
  }, [runSynthesis])

  const backToPhase = useCallback(
    (phase: 1 | 2 | 3) => setSwotPhase(phase),
    [setSwotPhase]
  )

  return {
    status,
    synthesis,
    editingId,
    editText,
    setEditText,
    isSaving,
    isRecovering,
    confirmedDraft,
    handleDeleteItem,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleSaveAndContinue,
    retryFromError,
    backToPhase,
  }
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Search, AlertTriangle, Check, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type { SwotDraft, ConflictCheckResult } from '@/lib/swot/coaching-types'

interface SwotConfirmButtonProps {
  draft: SwotDraft
  onConfirm: () => Promise<void>
  isConfirming: boolean
}

export function SwotConfirmButton({ draft, onConfirm, isConfirming }: SwotConfirmButtonProps) {
  const conflictResult = useSwotStore((s) => s.coachingWizard.conflictResult)
  const isCheckingConflicts = useSwotStore((s) => s.coachingWizard.isCheckingConflicts)
  const setConflictResult = useSwotStore((s) => s.setCoachingConflictResult)
  const setIsCheckingConflicts = useSwotStore((s) => s.setCoachingIsCheckingConflicts)
  const [hasSeenWarnings, setHasSeenWarnings] = useState(false)

  const handleClick = async () => {
    if (hasSeenWarnings || (conflictResult && !conflictResult.hasIssues)) {
      await onConfirm()
      return
    }
    if (conflictResult?.hasIssues) {
      setHasSeenWarnings(true)
      await onConfirm()
      return
    }
    setIsCheckingConflicts(true)
    try {
      const res = await fetch('/api/swot/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      })
      if (!res.ok) { await onConfirm(); return }
      const result: ConflictCheckResult = await res.json()
      setConflictResult(result)
      if (!result.hasIssues) { await onConfirm(); return }
      toast('Xem lại các điểm được đánh dấu — bạn vẫn có thể bỏ qua và tiếp tục')
      const firstId = result.issues[0]?.affectedItems[0]?.itemId
      if (firstId) {
        document.querySelector(`[data-item-id="${firstId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch {
      await onConfirm()
    } finally {
      setIsCheckingConflicts(false)
    }
  }

  if (isCheckingConflicts) {
    return (
      <Button
        disabled
        className="flex-1 border-2 border-ink bg-ink text-white font-display font-bold text-sm py-5 shadow-[4px_4px_0_#2C2B2B]"
      >
        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
        <Search className="mr-1 w-4 h-4" /> Đang kiểm tra...
      </Button>
    )
  }

  if (conflictResult?.hasIssues && !hasSeenWarnings) {
    const count = conflictResult.issues.length
    return (
      <Button
        onClick={handleClick}
        disabled={isConfirming}
        className="flex-1 border-2 border-ink bg-white text-ink font-display font-bold text-sm py-5 shadow-[4px_4px_0_#f59e0b] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
      >
        <AlertTriangle className="mr-1 w-4 h-4 text-[#f59e0b]" />
        Có {count} điểm cần xem lại — Bấm lần nữa để xác nhận
      </Button>
    )
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isConfirming}
      className="flex-1 border-2 border-ink bg-ink text-white font-display font-bold text-sm py-5 shadow-[4px_4px_0_#2C2B2B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
    >
      {isConfirming ? (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          Đang xác nhận...
        </>
      ) : (
        <>
          <Check className="mr-1 w-4 h-4" /> Xác nhận SWOT <ArrowRight className="ml-1 w-4 h-4" />
        </>
      )}
    </Button>
  )
}

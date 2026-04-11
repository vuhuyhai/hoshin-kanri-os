'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useSwotCoachingStore } from '@/lib/swot/coaching-store'
import type { SwotDraft, ConflictCheckResult } from '@/lib/swot/coaching-types'

interface SwotConfirmButtonProps {
  draft: SwotDraft
  onConfirm: () => Promise<void>
  isConfirming: boolean
}

export function SwotConfirmButton({
  draft,
  onConfirm,
  isConfirming,
}: SwotConfirmButtonProps) {
  const conflictResult = useSwotCoachingStore((s) => s.conflictResult)
  const isCheckingConflicts = useSwotCoachingStore((s) => s.isCheckingConflicts)
  const setConflictResult = useSwotCoachingStore((s) => s.setConflictResult)
  const setIsCheckingConflicts = useSwotCoachingStore((s) => s.setIsCheckingConflicts)
  const [hasSeenWarnings, setHasSeenWarnings] = useState(false)

  const handleClick = async () => {
    // State 4: warnings already seen or dismissed → confirm directly
    if (hasSeenWarnings || (conflictResult && !conflictResult.hasIssues)) {
      await onConfirm()
      return
    }

    // State 3: has warnings user hasn't dismissed → let them confirm anyway
    if (conflictResult?.hasIssues) {
      setHasSeenWarnings(true)
      await onConfirm()
      return
    }

    // State 1 → State 2: first click, run conflict check
    setIsCheckingConflicts(true)
    try {
      const res = await fetch('/api/swot/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      })

      if (!res.ok) {
        // fail-safe: confirm directly on API error
        await onConfirm()
        return
      }

      const result: ConflictCheckResult = await res.json()
      setConflictResult(result)

      if (!result.hasIssues) {
        // No issues → confirm immediately
        await onConfirm()
        return
      }

      // Has issues → show warnings, scroll to first flagged item
      toast('Xem lại các điểm được đánh dấu — bạn vẫn có thể bỏ qua và tiếp tục')
      const firstId = result.issues[0]?.affectedItems[0]?.itemId
      if (firstId) {
        const el = document.querySelector(`[data-item-id="${firstId}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch {
      // fail-safe: confirm on network error
      await onConfirm()
    } finally {
      setIsCheckingConflicts(false)
    }
  }

  // Render states
  if (isCheckingConflicts) {
    return (
      <Button disabled className="flex-1 border-2 border-black bg-black text-white font-display font-bold text-sm py-5 shadow-[4px_4px_0_#000]">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          🔍 Đang kiểm tra...
        </span>
      </Button>
    )
  }

  if (conflictResult?.hasIssues && !hasSeenWarnings) {
    const count = conflictResult.issues.length
    return (
      <Button onClick={handleClick} disabled={isConfirming}
        className="flex-1 border-2 border-amber-600 bg-amber-50 text-amber-800 font-display font-bold text-sm py-5 shadow-[4px_4px_0_rgb(217,119,6)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
        ⚠️ Có {count} điểm cần xem lại — Bấm lần nữa để xác nhận
      </Button>
    )
  }

  return (
    <Button onClick={handleClick} disabled={isConfirming}
      className="flex-1 border-2 border-black bg-black text-white font-display font-bold text-sm py-5 shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
      {isConfirming ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Đang xác nhận...
        </span>
      ) : '✅ Xác nhận SWOT — Sang bước Evidence →'}
    </Button>
  )
}

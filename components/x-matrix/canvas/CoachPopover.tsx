'use client'

import { useEffect, useRef } from 'react'
import {
  fetchCoachQuestions,
  makeCorrelationKey,
  useCanvas,
} from './state/CanvasContext'
import { cn } from '@/lib/utils'

interface CoachPopoverProps {
  yearGoalId: string
  hoshinId: string
  yearGoalTitle: string
  hoshinTitle: string
  visionContext?: string
  placement?: 'right' | 'below'
  onClose: () => void
}

export function CoachPopover({
  yearGoalId,
  hoshinId,
  yearGoalTitle,
  hoshinTitle,
  visionContext,
  placement = 'right',
  onClose,
}: CoachPopoverProps) {
  const { state, dispatch } = useCanvas()
  const key = makeCorrelationKey(yearGoalId, hoshinId)
  const entry = state.ui.coachCache[key]
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void fetchCoachQuestions(dispatch, state.ui.coachCache, {
      yearGoalId,
      hoshinId,
      yearGoalTitle,
      hoshinTitle,
      visionContext,
    })
    // Mount-only. Cache hit short-circuits inside the helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const handleRetry = () => {
    void fetchCoachQuestions(dispatch, state.ui.coachCache, {
      yearGoalId,
      hoshinId,
      yearGoalTitle,
      hoshinTitle,
      visionContext,
    })
  }

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Sensei đặt câu hỏi"
      className={cn(
        'absolute z-30 w-80 max-w-[calc(100vw-2rem)] rounded-[var(--radius-lg)] border-2 border-ink bg-bg-paper p-4 text-left shadow-[var(--shadow-lg)]',
        placement === 'right' ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold text-ink">
          🧙 Sensei hỏi
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="-mr-1 -mt-1 px-1 text-base leading-none text-text-3 hover:text-ink"
        >
          ×
        </button>
      </div>

      {entry?.loading && (
        <p className="text-xs italic text-text-2">🧙 Sensei đang nghĩ...</p>
      )}

      {entry?.error && !entry.loading && (
        <div className="space-y-2">
          <p className="text-xs italic text-text-2">{entry.error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="border-2 border-ink bg-bg px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent-cyan"
          >
            Thử lại
          </button>
        </div>
      )}

      {entry &&
        !entry.loading &&
        !entry.error &&
        entry.questions.length > 0 && (
          <ul className="space-y-2 text-sm leading-relaxed text-text-2">
            {entry.questions.map((q, i) => (
              <li
                key={i}
                className={cn(
                  'pl-1 italic',
                  i < entry.questions.length - 1 &&
                    'border-b border-text-3 pb-2',
                )}
              >
                ❓ {q}
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}

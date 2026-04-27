'use client'

import { useCanvas, type XMatrixYearGoal } from '../state/CanvasContext'

interface YearGoalCardProps {
  goal: XMatrixYearGoal | null
  slotIndex: number
}

export function YearGoalCard({ goal, slotIndex }: YearGoalCardProps) {
  const { dispatch } = useCanvas()

  const handleEmptyClick = () => {
    dispatch({
      type: 'ADD_YEAR_GOAL',
      payload: { title: '', description: '' },
    })
  }

  const handleFilledClick = () => {
    console.log('YearGoalCard clicked, will open modal in T3b', { slotIndex })
  }

  if (!goal) {
    return (
      <button
        type="button"
        onClick={handleEmptyClick}
        className="flex h-[60px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-2 transition-colors hover:bg-[var(--bg)]/70"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          + Mục tiêu năm #{slotIndex + 1}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleFilledClick}
      className="card-brutal flex h-[60px] w-full cursor-pointer flex-col items-start gap-0.5 p-2 text-left transition-shadow hover:shadow-[var(--shadow-lg)]"
    >
      <div className="flex w-full items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          Y{slotIndex + 1}
        </span>
        <h3 className="truncate text-sm font-semibold leading-tight text-ink">
          {goal.title || (
            <span className="text-[var(--text-3)]">(chưa đặt tên)</span>
          )}
        </h3>
      </div>
      {goal.description && (
        <p className="w-full truncate text-xs text-[var(--text-2)]">
          {goal.description}
        </p>
      )}
    </button>
  )
}

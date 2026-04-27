'use client'

import type { MockYearGoal } from '../XMatrixCanvasPage'

interface YearGoalCardProps {
  goal: MockYearGoal | null
  slotIndex: number
}

export function YearGoalCard({ goal, slotIndex }: YearGoalCardProps) {
  const handleClick = () => {
    console.log('YearGoalCard clicked, will open modal in Task 3', {
      slotIndex,
    })
  }

  if (!goal) {
    return (
      <button
        type="button"
        onClick={handleClick}
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
      onClick={handleClick}
      className="card-brutal flex h-[60px] w-full cursor-pointer flex-col items-start gap-0.5 p-2 text-left transition-shadow hover:shadow-[var(--shadow-lg)]"
    >
      <div className="flex w-full items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          Y{slotIndex + 1}
        </span>
        <h3 className="truncate text-sm font-semibold leading-tight text-ink">
          {goal.title}
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

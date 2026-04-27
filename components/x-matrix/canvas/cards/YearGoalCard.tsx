'use client'

import type { MockYearGoal } from '../XMatrixCanvasPage'

interface YearGoalCardProps {
  goal: MockYearGoal | null
  slotIndex: number
}

export function YearGoalCard({ goal, slotIndex }: YearGoalCardProps) {
  if (!goal) {
    return (
      <div
        role="presentation"
        className="flex min-h-[120px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-4"
      >
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
          + Thêm mục tiêu năm #{slotIndex + 1}
        </span>
      </div>
    )
  }

  return (
    <article className="card-brutal flex min-h-[120px] flex-col gap-2 p-4">
      <div className="overline">Mục tiêu #{slotIndex + 1}</div>
      <h3 className="text-base font-bold leading-tight text-ink">
        {goal.title}
      </h3>
      {goal.description && (
        <p className="text-sm leading-relaxed text-[var(--text-2)]">
          {goal.description}
        </p>
      )}
    </article>
  )
}

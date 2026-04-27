'use client'

import { YearGoalCard } from '../cards/YearGoalCard'
import type { MockYearGoal } from '../XMatrixCanvasPage'

interface NorthEdgeProps {
  yearGoals: MockYearGoal[]
}

export function NorthEdge({ yearGoals }: NorthEdgeProps) {
  const slots = Array.from({ length: 3 }, (_, i) => yearGoals[i] ?? null)

  return (
    <section className="flex h-full flex-col gap-1">
      <h2 className="heading-overline text-xs">🎯 Mục tiêu năm</h2>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {slots.map((goal, i) => (
          <YearGoalCard key={i} goal={goal} slotIndex={i} />
        ))}
      </div>
    </section>
  )
}

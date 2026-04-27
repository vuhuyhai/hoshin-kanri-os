'use client'

import { YearGoalCard } from '../cards/YearGoalCard'
import type { MockYearGoal } from '../XMatrixCanvasPage'

interface NorthEdgeProps {
  yearGoals: MockYearGoal[]
}

export function NorthEdge({ yearGoals }: NorthEdgeProps) {
  const slots = Array.from({ length: 3 }, (_, i) => yearGoals[i] ?? null)

  return (
    <section className="space-y-3">
      <h2 className="heading-overline">🎯 MỤC TIÊU NĂM (3-5 NĂM)</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {slots.map((goal, i) => (
          <YearGoalCard key={i} goal={goal} slotIndex={i} />
        ))}
      </div>
    </section>
  )
}

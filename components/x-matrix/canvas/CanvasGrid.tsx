'use client'

import { NorthEdge } from './edges/NorthEdge'
import { SouthEdge } from './edges/SouthEdge'
import { EastEdge } from './edges/EastEdge'
import { WestEdge } from './edges/WestEdge'
import { CenterX } from './CenterX'
import type { MockHoshin, MockYearGoal } from './XMatrixCanvasPage'

interface CanvasGridProps {
  yearGoals: MockYearGoal[]
  hoshins: MockHoshin[]
}

export function CanvasGrid({ yearGoals, hoshins }: CanvasGridProps) {
  return (
    <div className="bg-dot-grid bg-[var(--bg-paper)] px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-6 md:hidden">
        <NorthEdge yearGoals={yearGoals} />
        <SouthEdge hoshins={hoshins} />
        <EastEdge hoshins={hoshins} />
        <WestEdge hoshins={hoshins} />
      </div>

      <div className="hidden md:grid md:grid-cols-[1fr_2fr_1fr] md:gap-6">
        <div aria-hidden />
        <NorthEdge yearGoals={yearGoals} />
        <div aria-hidden />

        <WestEdge hoshins={hoshins} />
        <CenterX />
        <EastEdge hoshins={hoshins} />

        <div aria-hidden />
        <SouthEdge hoshins={hoshins} />
        <div aria-hidden />
      </div>
    </div>
  )
}

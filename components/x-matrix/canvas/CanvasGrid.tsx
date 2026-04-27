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
    <div className="bg-dot-grid bg-[var(--bg-paper)] px-4 py-4 lg:px-8">
      <div className="flex flex-col gap-3 md:hidden">
        <NorthEdge yearGoals={yearGoals} />
        <SouthEdge hoshins={hoshins} />
        <EastEdge hoshins={hoshins} />
        <WestEdge hoshins={hoshins} />
      </div>

      <div className="hidden md:grid md:grid-cols-[200px_1fr_200px] md:grid-rows-[90px_320px_200px] md:gap-3">
        <div className="md:col-span-3">
          <NorthEdge yearGoals={yearGoals} />
        </div>

        <WestEdge hoshins={hoshins} />
        <CenterX />
        <EastEdge hoshins={hoshins} />

        <div className="md:col-span-3">
          <SouthEdge hoshins={hoshins} />
        </div>
      </div>
    </div>
  )
}

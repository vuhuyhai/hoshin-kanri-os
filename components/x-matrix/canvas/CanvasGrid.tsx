'use client'

import { NorthEdge } from './edges/NorthEdge'
import { SouthEdge } from './edges/SouthEdge'
import { EastEdge } from './edges/EastEdge'
import { WestEdge } from './edges/WestEdge'
import { CenterX } from './CenterX'
import type { OrgMember } from '@/lib/x-matrix/types'

interface CanvasGridProps {
  members: OrgMember[]
  xMatrixId?: string
  canEdit?: boolean
}

export function CanvasGrid({ members, xMatrixId, canEdit }: CanvasGridProps) {
  return (
    <div
      className="bg-dot-grid bg-[var(--bg-paper)] px-4 py-4 lg:px-8"
      data-member-count={members.length}
    >
      <div className="flex flex-col gap-3 md:hidden">
        <NorthEdge />
        <SouthEdge />
        <EastEdge />
        <WestEdge />
      </div>

      <div className="hidden md:grid md:grid-cols-[200px_1fr_200px] md:grid-rows-[90px_320px_200px] md:gap-3">
        <div className="md:col-span-3">
          <NorthEdge />
        </div>

        <WestEdge />
        <CenterX xMatrixId={xMatrixId} canEdit={canEdit} />
        <EastEdge />

        <div className="md:col-span-3">
          <SouthEdge />
        </div>
      </div>
    </div>
  )
}

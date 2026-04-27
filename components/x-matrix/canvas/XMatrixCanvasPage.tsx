'use client'

import { CanvasProvider } from './state/CanvasContext'
import { CanvasHeader } from './CanvasHeader'
import { CanvasMiniMap } from './CanvasMiniMap'
import { CanvasGrid } from './CanvasGrid'
import { SubmitBar } from './SubmitBar'
import type { OrgMember } from '@/lib/x-matrix/types'

interface XMatrixCanvasPageProps {
  orgId: string
  members: OrgMember[]
}

export function XMatrixCanvasPage({ orgId, members }: XMatrixCanvasPageProps) {
  return (
    <CanvasProvider>
      <div
        className="w-full min-h-full bg-[var(--bg-paper)]"
        data-org-id={orgId}
        data-member-count={members.length}
      >
        <CanvasHeader />
        <CanvasMiniMap />
        <CanvasGrid members={members} />
        <SubmitBar />
      </div>
    </CanvasProvider>
  )
}

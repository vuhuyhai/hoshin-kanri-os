'use client'

import { useCallback } from 'react'
import { CanvasProvider, useCanvas } from './state/CanvasContext'
import { useLocalStorageSync } from './state/useLocalStorageSync'
import { CanvasHeader } from './CanvasHeader'
import { CanvasMiniMap } from './CanvasMiniMap'
import { CanvasGrid } from './CanvasGrid'
import { SubmitBar } from './SubmitBar'
import type { OrgMember } from '@/lib/x-matrix/types'

interface XMatrixCanvasPageProps {
  orgId: string
  members: OrgMember[]
}

function CanvasContent({ orgId, members }: XMatrixCanvasPageProps) {
  const { state, dispatch } = useCanvas()
  const storageKey = `xmatrix-canvas-draft-${orgId}-${new Date().getFullYear()}`

  const handleSaveStatusChange = useCallback(
    (status: 'saving' | 'saved' | 'error') => {
      dispatch({ type: 'SET_SAVE_STATUS', payload: status })
    },
    [dispatch]
  )

  useLocalStorageSync({
    storageKey,
    data: state.data,
    dispatch,
    onSaveStatusChange: handleSaveStatusChange,
  })

  return (
    <div
      className="w-full min-h-full bg-[var(--bg-paper)]"
      data-org-id={orgId}
      data-member-count={members.length}
    >
      <CanvasHeader storageKey={storageKey} />
      <CanvasMiniMap />
      <CanvasGrid members={members} />
      <SubmitBar />
    </div>
  )
}

export function XMatrixCanvasPage(props: XMatrixCanvasPageProps) {
  return (
    <CanvasProvider>
      <CanvasContent {...props} />
    </CanvasProvider>
  )
}

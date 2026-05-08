'use client'

import { useCallback } from 'react'
import { CanvasProvider, useCanvas } from './state/CanvasContext'
import { useLocalStorageSync } from './state/useLocalStorageSync'
import { CanvasHeader } from './CanvasHeader'
import { VisionEditor } from './VisionEditor'
import { CanvasMiniMap } from './CanvasMiniMap'
import { CanvasGrid } from './CanvasGrid'
import { SubmitBar } from './SubmitBar'
import type { OrgMember, XMatrixData } from '@/lib/x-matrix/types'

interface XMatrixCanvasPageProps {
  orgId: string
  members: OrgMember[]
  xMatrixId?: string
  canEdit?: boolean
  initialData?: XMatrixData
}

function CanvasContent({
  orgId,
  members,
  xMatrixId,
  initialData,
}: Omit<XMatrixCanvasPageProps, 'canEdit'>) {
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
    skipHydrate: !!initialData,
  })

  return (
    <div
      className="w-full min-h-full bg-[var(--bg-paper)]"
      data-org-id={orgId}
      data-member-count={members.length}
    >
      <CanvasHeader storageKey={storageKey} />
      <VisionEditor />
      <CanvasMiniMap />
      <CanvasGrid members={members} xMatrixId={xMatrixId} />
      <SubmitBar orgId={orgId} />
    </div>
  )
}

export function XMatrixCanvasPage(props: XMatrixCanvasPageProps) {
  return (
    <CanvasProvider
      xMatrixId={props.xMatrixId}
      initialData={props.initialData}
      canEdit={props.canEdit}
    >
      <CanvasContent {...props} />
    </CanvasProvider>
  )
}

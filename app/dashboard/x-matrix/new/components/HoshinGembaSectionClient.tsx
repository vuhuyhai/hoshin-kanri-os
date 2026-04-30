'use client'

import { createContext, useContext } from 'react'
import { GembaBanner } from '@/components/gemba/GembaBanner'
import type {
  GembaCommentWithAuthor,
  GembaUnreadSummary,
} from '@/lib/gemba/types'

type Role = 'CEO' | 'Manager' | 'Member'

interface ContextValue {
  commentsMap: Record<string, GembaCommentWithAuthor[]>
  canModerate: boolean
  xMatrixId: string | null
}

const HoshinGembaContext = createContext<ContextValue | null>(null)

// Hook cho HoshinCard (Task 3B). Outside Provider → defensive default
// (Member redirect ra /dashboard ở page-level role-gate, nhưng future
// M-Hoshin-7 nới Member writer sẽ exercise null path).
export function useHoshinGembaComments(hoshinId: string): {
  comments: GembaCommentWithAuthor[]
  canModerate: boolean
  xMatrixId: string | null
} {
  const ctx = useContext(HoshinGembaContext)
  if (!ctx) {
    return { comments: [], canModerate: false, xMatrixId: null }
  }
  return {
    comments: ctx.commentsMap[hoshinId] ?? [],
    canModerate: ctx.canModerate,
    xMatrixId: ctx.xMatrixId,
  }
}

interface Props {
  summary: GembaUnreadSummary
  commentsMap: Record<string, GembaCommentWithAuthor[]>
  role: Role
  xMatrixId: string | null
  children: React.ReactNode
}

export function HoshinGembaSectionClient({
  summary,
  commentsMap,
  role,
  xMatrixId,
  children,
}: Props) {
  // Q-canvas page-level đã redirect Member → /dashboard. canModerate
  // luôn true cho rendered users (CEO + Manager). Field giữ trong
  // context cho symmetry với KpiGembaSectionClient + future
  // M-Hoshin-7 nới Member writer.
  const canModerate = role !== 'Member'
  return (
    <>
      <GembaBanner summary={summary} canModerate={canModerate} />
      <HoshinGembaContext.Provider
        value={{ commentsMap, canModerate, xMatrixId }}
      >
        {children}
      </HoshinGembaContext.Provider>
    </>
  )
}

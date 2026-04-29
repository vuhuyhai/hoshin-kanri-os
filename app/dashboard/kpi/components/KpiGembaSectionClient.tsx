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
  role: Role
}

const GembaCommentsContext = createContext<ContextValue | null>(null)

// Hook cho KpiCard (rendered bên trong KpiDashboardClient bên trong
// Provider này). Nếu render outside Provider — defensive default
// trả về empty + canModerate=false để KpiCard không crash.
export function useGembaComments(kpiId: string): {
  comments: GembaCommentWithAuthor[]
  canModerate: boolean
} {
  const ctx = useContext(GembaCommentsContext)
  if (!ctx) return { comments: [], canModerate: false }
  return {
    comments: ctx.commentsMap[kpiId] ?? [],
    canModerate: ctx.role !== 'Member',
  }
}

interface Props {
  summary: GembaUnreadSummary
  commentsMap: Record<string, GembaCommentWithAuthor[]>
  role: Role
  children: React.ReactNode
}

export function KpiGembaSectionClient({
  summary,
  commentsMap,
  role,
  children,
}: Props) {
  return (
    <>
      <GembaBanner summary={summary} canModerate={role !== 'Member'} />
      <GembaCommentsContext.Provider value={{ commentsMap, role }}>
        {children}
      </GembaCommentsContext.Provider>
    </>
  )
}

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
  existingHoshinIds: string[]
}

const HoshinGembaContext = createContext<ContextValue | null>(null)

// Hook cho HoshinCard (Task 3B). Outside Provider → defensive default
// (Member redirect ra /dashboard ở page-level role-gate, nhưng future
// M-Hoshin-7 nới Member writer sẽ exercise null path).
//
// isPersisted (M-Hoshin-6.1 hotfix): hoshin.id có nằm trong vision_json
// đã save chưa. False = Hoshin client-only (chưa SubmitBar save) →
// gate form ở GembaModal tránh orphan target_id.
export function useHoshinGembaComments(hoshinId: string): {
  comments: GembaCommentWithAuthor[]
  canModerate: boolean
  xMatrixId: string | null
  isPersisted: boolean
} {
  const ctx = useContext(HoshinGembaContext)
  if (!ctx) {
    return {
      comments: [],
      canModerate: false,
      xMatrixId: null,
      isPersisted: false,
    }
  }
  return {
    comments: ctx.commentsMap[hoshinId] ?? [],
    canModerate: ctx.canModerate,
    xMatrixId: ctx.xMatrixId,
    isPersisted: ctx.existingHoshinIds.includes(hoshinId),
  }
}

interface Props {
  summary: GembaUnreadSummary
  commentsMap: Record<string, GembaCommentWithAuthor[]>
  role: Role
  xMatrixId: string | null
  existingHoshinIds: string[]
  children: React.ReactNode
}

export function HoshinGembaSectionClient({
  summary,
  commentsMap,
  role,
  xMatrixId,
  existingHoshinIds,
  children,
}: Props) {
  // Q-canvas page-level đã redirect Member → /dashboard. canModerate
  // luôn true cho rendered users (CEO + Manager). Field giữ trong
  // context cho symmetry với KpiGembaSectionClient + future
  // M-Hoshin-7 nới Member writer.
  const canModerate = role !== 'Member'

  // Banner ở canvas page chỉ phản ánh Hoshin signals — KPI count đã
  // hiện ở /dashboard/kpi banner. Filter org-wide summary xuống
  // hoshin-targets để "X góp ý chưa xử lý trên N mục" không inflate
  // bằng KPI counts (hai page độc lập, conditional render
  // total_open===0 vẫn hoạt động đúng cho từng trang).
  const hoshinByTarget = summary.by_target.filter(
    (t) => t.target_type === 'hoshin',
  )
  const hoshinSummary = {
    total_open: hoshinByTarget.reduce((sum, t) => sum + t.count, 0),
    by_target: hoshinByTarget,
  }

  return (
    <>
      <GembaBanner
        summary={hoshinSummary}
        canModerate={canModerate}
        targetLabel="Hoshin"
      />
      <HoshinGembaContext.Provider
        value={{ commentsMap, canModerate, xMatrixId, existingHoshinIds }}
      >
        {children}
      </HoshinGembaContext.Provider>
    </>
  )
}

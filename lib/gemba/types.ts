import type { Database } from '@/lib/supabase/types'

// Constants — single source of truth, mirrored vào Zod schemas
// trong lib/validation/schemas.ts. Body bounds match CHECK constraint
// trong migration 033.

export const GEMBA_TARGET_TYPES = ['hoshin', 'kpi'] as const
export const GEMBA_STATUSES = ['open', 'acknowledged', 'resolved'] as const

export const GEMBA_BODY_MIN = 20
export const GEMBA_BODY_MAX = 1000

// Type aliases — Database là canonical, derive từ generated types
// thay vì redeclare để tránh drift.

export type GembaTargetType = Database['public']['Enums']['gemba_target_type']
export type GembaStatus = Database['public']['Enums']['gemba_status']

export type GembaCommentRow = Database['public']['Tables']['gemba_comments']['Row']
export type GembaCommentInsert = Database['public']['Tables']['gemba_comments']['Insert']
export type GembaCommentUpdate = Database['public']['Tables']['gemba_comments']['Update']

// Enriched cho UI: join với profiles.full_name (auth.users không
// query được qua user-context RLS). author_email defer M-Hoshin-6.

export type GembaCommentWithAuthor = GembaCommentRow & {
  author_name: string | null
  author_email: string
  acknowledged_by_name?: string | null
  resolved_by_name?: string | null
}

// Banner CEO: total + grouped by target để render
// "5 góp ý mới trên 3 KPIs + 2 Hoshins".

export type GembaUnreadSummary = {
  total_open: number
  by_target: Array<{
    target_type: GembaTargetType
    target_id: string
    count: number
  }>
}

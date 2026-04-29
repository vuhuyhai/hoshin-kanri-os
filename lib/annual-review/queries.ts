import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>

export interface ReviewableMatrix {
  xMatrixId: string
  year: number
  title: string | null
  reviewId: string | null
  reviewStatus: 'draft' | 'completed' | 'transitioned' | null
}

export async function getReviewableMatrices(
  supabase: Client,
  orgId: string,
): Promise<ReviewableMatrix[]> {
  const currentYear = new Date().getFullYear()

  const { data: matrices, error: mxError } = await supabase
    .from('x_matrices')
    .select('id, year, title')
    .eq('org_id', orgId)
    .lt('year', currentYear)
    .in('status', ['active', 'archived'])
    .order('year', { ascending: false })

  if (mxError || !matrices?.length) return []

  const matrixIds = matrices.map((m) => m.id)
  const { data: reviews } = await supabase
    .from('annual_reviews')
    .select('id, x_matrix_id, status')
    .in('x_matrix_id', matrixIds)

  const reviewMap = new Map(
    (reviews ?? []).map((r) => [r.x_matrix_id, { id: r.id, status: r.status }] as const),
  )

  return matrices.map((m) => {
    const review = reviewMap.get(m.id)
    return {
      xMatrixId: m.id,
      year: m.year,
      title: m.title,
      reviewId: review?.id ?? null,
      reviewStatus:
        (review?.status as 'draft' | 'completed' | 'transitioned' | null) ?? null,
    }
  })
}

export function filterPendingReview(matrices: ReviewableMatrix[]): ReviewableMatrix[] {
  return matrices.filter((m) => m.reviewStatus !== 'transitioned')
}

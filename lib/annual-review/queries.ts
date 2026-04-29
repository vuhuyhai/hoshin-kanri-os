import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { XMatrixData } from '@/lib/x-matrix/types'
import type {
  ReviewStatus,
  CarryOverDecision,
} from '@/lib/annual-review/types'

type Client = SupabaseClient<Database>

export interface ReviewableMatrix {
  xMatrixId: string
  year: number
  title: string | null
  reviewId: string | null
  reviewStatus: ReviewStatus | null
}

export interface ReviewKpi {
  id: string
  name: string
  unit: string | null
  targetValue: number
  frequency: string
  hoshinId: string | null
}

export interface ReviewPageData {
  matrix: {
    id: string
    year: number
    title: string | null
    visionJson: XMatrixData
    orgId: string
  }
  review: {
    id: string
    status: ReviewStatus
    a3: {
      background: string
      currentState: string
      targetGap: string
      nextAction: string
    }
    kpiActuals: Array<{
      kpiId: string
      actualValue: number
      achievementPct: number
      note: string | null
    }>
    carryOvers: Array<{
      sourceHoshinId: string
      decision: CarryOverDecision
      modifiedTitle: string | null
      rationale: string | null
    }>
  } | null
  kpis: ReviewKpi[]
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

/**
 * Fetch the X-Matrix for a given year + its annual_review (if any) +
 * KPIs linked to the matrix. Returns null when the matrix doesn't exist
 * or the user can't see it (RLS filters it out). When the matrix exists
 * but no review row has been created yet, `review` is null and the
 * caller should auto-create one before rendering the form.
 */
export async function getReviewPageData(
  supabase: Client,
  orgId: string,
  year: number,
): Promise<ReviewPageData | null> {
  const { data: matrix } = await supabase
    .from('x_matrices')
    .select('id, year, title, vision_json, org_id')
    .eq('org_id', orgId)
    .eq('year', year)
    .in('status', ['active', 'archived'])
    .maybeSingle()

  if (!matrix) return null

  const visionJson = (matrix.vision_json ?? {
    vision: '',
    yearGoals: [],
    hoshins: [],
  }) as unknown as XMatrixData

  const matrixOut = {
    id: matrix.id,
    year: matrix.year,
    title: matrix.title,
    visionJson,
    orgId: matrix.org_id,
  }

  const { data: review } = await supabase
    .from('annual_reviews')
    .select(
      'id, status, a3_background, a3_current_state, a3_target_gap, a3_next_action',
    )
    .eq('x_matrix_id', matrix.id)
    .maybeSingle()

  if (!review) {
    return {
      matrix: matrixOut,
      review: null,
      kpis: [],
    }
  }

  const [actualsRes, carryOversRes, kpisRes] = await Promise.all([
    supabase
      .from('kpi_actuals')
      .select('kpi_id, actual_value, achievement_pct, note')
      .eq('annual_review_id', review.id),
    supabase
      .from('carry_overs')
      .select('source_hoshin_id, decision, modified_title, rationale')
      .eq('annual_review_id', review.id),
    supabase
      .from('kpis')
      .select('id, name, unit, target_value, frequency')
      .eq('org_id', orgId)
      .eq('x_matrix_id', matrix.id)
      .eq('is_active', true),
  ])

  // Map kpi → hoshin via vision_json (kpis are nested inside hoshins
  // there, while the kpis DB table only stores the matrix link). Names
  // are the join key because the vision_json kpi.id is regenerated on
  // each save and won't match the DB row.
  const hoshinKpiMap = new Map<string, string>()
  for (const hoshin of visionJson.hoshins ?? []) {
    for (const kpi of hoshin.kpis ?? []) {
      hoshinKpiMap.set(kpi.name, hoshin.id)
    }
  }

  return {
    matrix: matrixOut,
    review: {
      id: review.id,
      status: review.status,
      a3: {
        background: review.a3_background ?? '',
        currentState: review.a3_current_state ?? '',
        targetGap: review.a3_target_gap ?? '',
        nextAction: review.a3_next_action ?? '',
      },
      kpiActuals: (actualsRes.data ?? []).map((a) => ({
        kpiId: a.kpi_id,
        actualValue: Number(a.actual_value),
        achievementPct: a.achievement_pct == null ? 0 : Number(a.achievement_pct),
        note: a.note,
      })),
      carryOvers: (carryOversRes.data ?? []).map((c) => ({
        sourceHoshinId: c.source_hoshin_id,
        decision: c.decision,
        modifiedTitle: c.modified_title,
        rationale: c.rationale,
      })),
    },
    kpis: (kpisRes.data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      unit: k.unit,
      targetValue: Number(k.target_value),
      frequency: k.frequency,
      hoshinId: hoshinKpiMap.get(k.name) ?? null,
    })),
  }
}

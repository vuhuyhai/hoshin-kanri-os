import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  TowsStrategyWithFactorsRecord,
  StrategyStatus,
  BscPerspective,
} from '@/lib/swot/tows-types'

async function verifyAnalysisOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  analysisId: string,
) {
  const { data: analysis } = await supabase
    .from('swot_analyses')
    .select('org_id')
    .eq('id', analysisId)
    .single()
  if (!analysis) return null

  const { data: member } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', analysis.org_id)
    .single()

  return member ? analysis.org_id : null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await verifyAnalysisOwnership(supabase, user.id, analysisId)
    if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: strategies, error } = await supabase
      .from('tows_strategies')
      .select('*')
      .eq('swot_analysis_id', analysisId)
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich each strategy with its factors
    const enriched: TowsStrategyWithFactorsRecord[] = []
    for (const s of strategies ?? []) {
      const { data: swFactors } = await supabase
        .from('swot_factors')
        .select('*')
        .in('id', s.sw_factor_ids?.length ? s.sw_factor_ids : ['__none__'])

      const { data: otFactors } = await supabase
        .from('swot_factors')
        .select('*')
        .in('id', s.ot_factor_ids?.length ? s.ot_factor_ids : ['__none__'])

      enriched.push({
        ...s,
        sw_factors: swFactors ?? [],
        ot_factors: otFactors ?? [],
      } as TowsStrategyWithFactorsRecord)
    }

    return NextResponse.json(enriched)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy danh sách chiến lược'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await verifyAnalysisOwnership(supabase, user.id, analysisId)
    if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = (await req.json()) as {
      id: string
      status?: StrategyStatus
      order_index?: number
      bsc_perspective?: BscPerspective
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Thiếu id chiến lược' }, { status: 400 })
    }

    const updates: {
      status?: string
      order_index?: number
      bsc_perspective?: string
    } = {}
    if (body.status !== undefined) updates.status = body.status
    if (body.order_index !== undefined) updates.order_index = body.order_index
    if (body.bsc_perspective !== undefined) updates.bsc_perspective = body.bsc_perspective

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Không có trường nào để cập nhật' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('tows_strategies')
      .update(updates)
      .eq('id', body.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật chiến lược'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRoleForAnalysis,
  ALL_ROLES,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type {
  TowsStrategyWithFactorsRecord,
  StrategyStatus,
  BscPerspective,
} from '@/lib/swot/tows-types'

type FactorRow = Database['public']['Tables']['swot_factors']['Row']

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const check = await requireOrgRoleForAnalysis(supabase, user.id, analysisId, ALL_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const { data: strategies, error } = await supabase
      .from('tows_strategies')
      .select('*')
      .eq('swot_analysis_id', analysisId)
      .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Batch-fetch all referenced factors in 1 query instead of N+1
    const allFactorIds = new Set<string>()
    for (const s of strategies ?? []) {
      for (const id of s.sw_factor_ids ?? []) allFactorIds.add(id)
      for (const id of s.ot_factor_ids ?? []) allFactorIds.add(id)
    }

    const factorsById = new Map<string, FactorRow>()
    if (allFactorIds.size > 0) {
      const { data: allFactors } = await supabase
        .from('swot_factors')
        .select('*')
        .in('id', [...allFactorIds])
      for (const f of allFactors ?? []) factorsById.set(f.id, f)
    }

    const enriched: TowsStrategyWithFactorsRecord[] = (strategies ?? []).map((s) => {
      const swf = (s.sw_factor_ids ?? []).reduce<FactorRow[]>((acc, id) => {
        const f = factorsById.get(id); if (f) acc.push(f); return acc
      }, [])
      const otf = (s.ot_factor_ids ?? []).reduce<FactorRow[]>((acc, id) => {
        const f = factorsById.get(id); if (f) acc.push(f); return acc
      }, [])
      return { ...s, sw_factors: swf, ot_factors: otf } as TowsStrategyWithFactorsRecord
    })

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

    const check = await requireOrgRoleForAnalysis(supabase, user.id, analysisId, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    const { orgId } = check

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

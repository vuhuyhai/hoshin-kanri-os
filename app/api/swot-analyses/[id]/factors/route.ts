import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRoleForAnalysis,
  ALL_ROLES,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { SwotQuadrant } from '@/lib/swot/types'
import { reserveFactorCodes } from '@/lib/swot/factor-utils'
import { parseBody, createSwotFactorSchema } from '@/lib/validation'

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

    const { data: factors, error } = await supabase
      .from('swot_factors')
      .select('*')
      .eq('swot_analysis_id', analysisId)
      .order('priority_rank', { ascending: true, nullsFirst: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const grouped: Record<string, typeof factors> = { S: [], W: [], O: [], T: [] }
    for (const f of factors ?? []) {
      if (grouped[f.quadrant]) grouped[f.quadrant].push(f)
    }

    return NextResponse.json(grouped)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy danh sách yếu tố'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(req, createSwotFactorSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data

    const check = await requireOrgRoleForAnalysis(supabase, user.id, analysisId, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    const { orgId } = check

    // Atomic code reservation via Postgres RPC (migration 014).
    // No retry loop needed — the sequence table's PK row lock
    // serializes concurrent callers.
    const startNum = await reserveFactorCodes(
      supabase,
      analysisId,
      body.quadrant as SwotQuadrant,
      1,
    )
    const code = `${body.quadrant}${startNum}`

    const { data: factor, error } = await supabase
      .from('swot_factors')
      .insert({
        org_id: orgId,
        swot_analysis_id: analysisId,
        quadrant: body.quadrant,
        code,
        content: body.content,
        source_framework: body.source_framework ?? null,
        source_ref: body.source_ref ?? null,
        evidence_text: body.evidence_text ?? null,
        is_key_factor: body.is_key_factor ?? false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(factor, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo yếu tố'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

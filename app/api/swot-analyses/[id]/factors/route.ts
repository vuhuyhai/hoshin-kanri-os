import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SwotQuadrant } from '@/lib/swot/types'
import type { CreateSwotFactorDto } from '@/lib/swot/tows-types'
import { reserveFactorCodes } from '@/lib/swot/factor-utils'

const VALID_QUADRANTS = ['S', 'W', 'O', 'T']

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
  if (!member) return null

  return analysis.org_id
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
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as CreateSwotFactorDto
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 })
    }
    if (!VALID_QUADRANTS.includes(body.quadrant)) {
      return NextResponse.json({ error: 'Quadrant không hợp lệ' }, { status: 400 })
    }

    const orgId = await verifyAnalysisOwnership(supabase, user.id, analysisId)
    if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
        content: body.content.trim(),
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

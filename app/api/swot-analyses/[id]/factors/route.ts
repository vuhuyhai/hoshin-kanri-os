import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SwotQuadrant } from '@/lib/swot/types'
import type { CreateSwotFactorDto } from '@/lib/swot/tows-types'
import { generateFactorCode } from '@/lib/swot/factor-utils'

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

    // Retry loop: generateFactorCode is count-based and not atomic,
    // so a concurrent request could produce a duplicate code.
    // The UNIQUE(swot_analysis_id, code) constraint catches this — retry with next code.
    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const code = await generateFactorCode(
        supabase,
        analysisId,
        body.quadrant as SwotQuadrant,
      )

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

      if (!error) return NextResponse.json(factor, { status: 201 })

      // 23505 = unique_violation in PostgreSQL
      const isUniqueViolation = error.code === '23505'
      if (!isUniqueViolation || attempt === MAX_RETRIES - 1) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo yếu tố'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

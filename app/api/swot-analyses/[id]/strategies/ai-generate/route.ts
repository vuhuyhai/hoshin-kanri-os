import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRoleForAnalysis,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { TowsQuadrant, AiStrategyItem } from '@/lib/swot/tows-types'
import { generateCombinedCode } from '@/lib/swot/factor-utils'
import { buildTowsPrompt } from '@/lib/swot/tows-prompts'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'

const anthropic = createAnthropicClient()
const VALID_TOWS: TowsQuadrant[] = ['SO', 'WO', 'ST', 'WT']

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: analysisId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json()) as {
      sw_factor_ids: string[]
      ot_factor_ids: string[]
      quadrant: TowsQuadrant
    }

    // Validate inputs
    if (!body.sw_factor_ids?.length) {
      return NextResponse.json({ error: 'Cần ít nhất 1 yếu tố S/W' }, { status: 400 })
    }
    if (!body.ot_factor_ids?.length) {
      return NextResponse.json({ error: 'Cần ít nhất 1 yếu tố O/T' }, { status: 400 })
    }
    if (!VALID_TOWS.includes(body.quadrant)) {
      return NextResponse.json({ error: 'Quadrant TOWS không hợp lệ' }, { status: 400 })
    }

    const check = await requireOrgRoleForAnalysis(supabase, user.id, analysisId, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    const { orgId } = check

    // Fetch SW factors
    const { data: swFactors, error: swErr } = await supabase
      .from('swot_factors')
      .select('*')
      .in('id', body.sw_factor_ids)
    if (swErr) return NextResponse.json({ error: swErr.message }, { status: 500 })

    // Fetch OT factors
    const { data: otFactors, error: otErr } = await supabase
      .from('swot_factors')
      .select('*')
      .in('id', body.ot_factor_ids)
    if (otErr) return NextResponse.json({ error: otErr.message }, { status: 500 })

    // Verify all factors belong to the same org
    const allFactors = [...(swFactors ?? []), ...(otFactors ?? [])]
    if (allFactors.some((f) => f.org_id !== orgId)) {
      return NextResponse.json({ error: 'Yếu tố không thuộc org này' }, { status: 403 })
    }

    // Fetch org context
    const { data: org } = await supabase
      .from('organizations')
      .select('industry, headcount, city')
      .eq('id', orgId)
      .single()
    if (!org) return NextResponse.json({ error: 'Tổ chức không tồn tại' }, { status: 404 })

    // Build prompt and call AI
    const prompt = buildTowsPrompt({
      sw_factors: (swFactors ?? []).map((f) => ({
        code: f.code,
        content: f.content,
        evidence_text: f.evidence_text,
      })),
      ot_factors: (otFactors ?? []).map((f) => ({
        code: f.code,
        content: f.content,
        evidence_text: f.evidence_text,
      })),
      quadrant: body.quadrant,
      org_context: {
        industry: org.industry,
        headcount: org.headcount,
        city: org.city,
      },
    })

    const message = await anthropic.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    let items: AiStrategyItem[]
    try {
      items = JSON.parse(cleaned) as AiStrategyItem[]
    } catch {
      return NextResponse.json(
        { error: 'AI trả về JSON không hợp lệ. Vui lòng thử lại.' },
        { status: 500 },
      )
    }

    // Generate combined code base
    const baseCode = generateCombinedCode(swFactors ?? [], otFactors ?? [])

    // Insert each strategy
    const inserted = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const combinedCode = i === 0 ? baseCode : `${baseCode}-${i + 1}`

      const { data: row, error: insertErr } = await supabase
        .from('tows_strategies')
        .insert({
          org_id: orgId,
          swot_analysis_id: analysisId,
          quadrant: body.quadrant,
          sw_factor_ids: body.sw_factor_ids,
          ot_factor_ids: body.ot_factor_ids,
          combined_code: combinedCode,
          bsc_perspective: item.bsc_perspective,
          strategy_statement: item.strategy_statement,
          strategy_title: item.strategy_title,
          ai_generated: true,
          status: 'draft',
          order_index: i,
        })
        .select()
        .single()

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
      inserted.push(row)
    }

    // Hydrate sw_factors / ot_factors so the response matches
    // TowsStrategyWithFactorsRecord — the shape the GET /strategies route
    // returns and StrategyReviewTable expects. Without this the client
    // crashes on s.sw_factors.map(...).
    const enriched = inserted.map((row) => ({
      ...row,
      sw_factors: swFactors ?? [],
      ot_factors: otFactors ?? [],
    }))

    return NextResponse.json(enriched, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi tạo chiến lược AI'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

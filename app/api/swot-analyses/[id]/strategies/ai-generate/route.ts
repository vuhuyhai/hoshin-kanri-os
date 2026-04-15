import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import {
  createClient,
  requireOrgRoleForAnalysis,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { AiStrategyItem, BscPerspective } from '@/lib/swot/tows-types'
import { generateCombinedCode } from '@/lib/swot/factor-utils'
import { buildTowsPrompt } from '@/lib/swot/tows-prompts'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'
import { parseBody, generateStrategySchema } from '@/lib/validation'

export const maxDuration = 120

const STRATEGIES_TOOL: Anthropic.Tool = {
  name: 'submit_strategies',
  description:
    'Submit 2-3 TOWS strategies combining SW and OT factors for a single quadrant.',
  input_schema: {
    type: 'object',
    properties: {
      strategies: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            strategy_title: {
              type: 'string',
              description: 'Tên chiến lược ngắn gọn',
            },
            strategy_statement: {
              type: 'string',
              description:
                'Mô tả 2-3 câu, actionable, bắt đầu bằng động từ',
            },
            bsc_perspective: {
              type: 'string',
              enum: ['finance', 'customer', 'process', 'learning'],
            },
          },
          required: [
            'strategy_title',
            'strategy_statement',
            'bsc_perspective',
          ],
        },
      },
    },
    required: ['strategies'],
  },
}

const VALID_BSC: readonly BscPerspective[] = [
  'finance',
  'customer',
  'process',
  'learning',
]

async function callStrategiesAI(
  client: Anthropic,
  prompt: string,
): Promise<AiStrategyItem[]> {
  const response = await client.messages.create({
    model: AI_MODELS.reasoning,
    // 2-3 strategies × (title + 2-3 sentence statement) in Vietnamese plus
    // JSON/schema overhead. 1000 was truncating strategy_statement mid-
    // sentence. 4096 is comfortable.
    max_tokens: 4096,
    tools: [STRATEGIES_TOOL],
    tool_choice: { type: 'tool', name: 'submit_strategies' },
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    console.error(
      '[tows-ai-generate] hit max_tokens before completing tool call',
    )
    throw new Error('max_tokens')
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    console.error(
      '[tows-ai-generate] no tool_use block. stop_reason=',
      response.stop_reason,
      'content:',
      JSON.stringify(response.content).slice(0, 800),
    )
    throw new Error('no_tool_use')
  }

  const parsed = toolBlock.input as { strategies?: unknown }

  if (!Array.isArray(parsed.strategies) || parsed.strategies.length === 0) {
    throw new Error('missing_strategies')
  }

  const items: AiStrategyItem[] = []
  for (let i = 0; i < parsed.strategies.length; i++) {
    const raw = parsed.strategies[i]
    if (!raw || typeof raw !== 'object') {
      throw new Error(`invalid_item_${i}`)
    }
    const rec = raw as Record<string, unknown>
    if (
      typeof rec.strategy_title !== 'string' ||
      !rec.strategy_title.trim()
    ) {
      throw new Error(`missing_title_${i}`)
    }
    if (
      typeof rec.strategy_statement !== 'string' ||
      !rec.strategy_statement.trim()
    ) {
      throw new Error(`missing_statement_${i}`)
    }
    if (!VALID_BSC.includes(rec.bsc_perspective as BscPerspective)) {
      throw new Error(`invalid_bsc_${i}`)
    }
    items.push({
      strategy_title: rec.strategy_title,
      strategy_statement: rec.strategy_statement,
      bsc_perspective: rec.bsc_perspective as BscPerspective,
    })
  }

  return items
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

    const parsed = await parseBody(req, generateStrategySchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data

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

    // Build prompt and call AI with retry-once pattern
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

    const client = createAnthropicClient()
    let items: AiStrategyItem[]
    let firstReason = ''
    try {
      items = await callStrategiesAI(client, prompt)
    } catch (firstErr) {
      firstReason = (firstErr as Error).message
      console.warn('[tows-ai-generate] first attempt failed:', firstReason)
      try {
        items = await callStrategiesAI(client, prompt)
      } catch (secondErr) {
        const secondReason = (secondErr as Error).message
        console.error('[tows-ai-generate] retry also failed:', secondReason)
        return NextResponse.json(
          {
            error: `AI trả về định dạng không hợp lệ (${secondReason}). Thử lại.`,
            debug: { firstReason, secondReason },
          },
          { status: 500 },
        )
      }
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

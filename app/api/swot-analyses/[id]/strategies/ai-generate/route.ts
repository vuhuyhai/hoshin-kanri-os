import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import {
  createClient,
  requireOrgRoleForAnalysis,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import type {
  AiStrategyItem,
  BscPerspective,
  StrategyAction,
  KpiSuggestion,
  Timeframe,
} from '@/lib/swot/tows-types'
import { generateCombinedCode } from '@/lib/swot/factor-utils'
import { buildTowsPrompt } from '@/lib/swot/tows-prompts'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'
import { parseBody, generateStrategySchema } from '@/lib/validation'
import { requireAiRateLimit } from '@/lib/ai/rate-limit-helper'

export const maxDuration = 120

const STRATEGIES_TOOL: Anthropic.Tool = {
  name: 'submit_strategies',
  description:
    'Submit 2-3 candidate Hoshins (TOWS breakthrough strategies) combining SW and OT factors for a single quadrant. Each Hoshin must follow targets-means deployment structure: title, statement, BSC perspective, timeframe, rationale, actions, KPI suggestions.',
  input_schema: {
    type: 'object',
    properties: {
      strategies: {
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            strategy_title: {
              type: 'string',
              description: 'Tên Hoshin ngắn 5-12 từ, mạnh, dễ nhớ',
            },
            strategy_statement: {
              type: 'string',
              description:
                'Mô tả 2-3 câu: WHAT (làm gì) + HOW (cách làm) + WHY (kết quả). Bắt đầu bằng động từ mạnh.',
            },
            bsc_perspective: {
              type: 'string',
              enum: ['finance', 'customer', 'process', 'learning'],
              description: 'BSC perspective phù hợp Hoshin này',
            },
            timeframe: {
              type: 'string',
              enum: ['30d', '60d', '90d'],
              description:
                'Hoshin discipline timeframe: 30d quick win, 60d vừa, 90d chiến lược lớn',
            },
            rationale: {
              type: 'string',
              description:
                'Vital signal 1-2 câu: kết hợp [code] với [code] và tại sao đây là breakthrough (không phải kaizen)',
            },
            actions: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              description: 'Đúng 3 actions theo means deployment',
              items: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description:
                      '1 câu cụ thể, bắt đầu bằng động từ mạnh (Triển khai, Tổ chức, Áp dụng...)',
                  },
                  owner_hint: {
                    type: 'string',
                    description:
                      'Role thực tế trong SME VN: CEO / Trưởng phòng X / Nhân viên / Giám sát ca',
                  },
                },
                required: ['description'],
              },
            },
            kpi_suggestions: {
              type: 'array',
              minItems: 1,
              maxItems: 2,
              description: '1-2 SMART KPIs, ưu tiên leading indicator',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Tên KPI VN-friendly (vd: "Số khách quay lại trong 30 ngày")',
                  },
                  unit: {
                    type: 'string',
                    description: 'Đơn vị: %, đồng, người, đơn, lần, ngày',
                  },
                  target_value: {
                    type: 'number',
                    description: 'Số cụ thể, không phải "tăng X%" mà là mức cần đạt',
                  },
                  frequency: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly'],
                    description: 'daily=vận hành, weekly=execution, monthly=strategy',
                  },
                },
                required: ['name', 'unit', 'target_value', 'frequency'],
              },
            },
          },
          required: [
            'strategy_title',
            'strategy_statement',
            'bsc_perspective',
            'timeframe',
            'rationale',
            'actions',
            'kpi_suggestions',
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
    // 2-3 candidate Hoshins × 7 fields (title, statement, BSC, timeframe,
    // rationale, 3 actions with owner_hint, 1-2 KPIs with target+freq) in
    // Vietnamese (dày token ~1.5 chars/token). 4096 truncates around the 2nd
    // strategy. 8000 leaves comfortable headroom matching X-Ray fix pattern
    // (see HANDOFF X-Ray production hotfix 2026-04-26).
    max_tokens: 8000,
    tools: [STRATEGIES_TOOL],
    tool_choice: { type: 'tool', name: 'submit_strategies' },
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    throw new Error('max_tokens')
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
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
    const VALID_TIMEFRAME: readonly Timeframe[] = ['30d', '60d', '90d']
    const VALID_FREQUENCY = ['daily', 'weekly', 'monthly'] as const
    type Frequency = (typeof VALID_FREQUENCY)[number]

    if (!VALID_TIMEFRAME.includes(rec.timeframe as Timeframe)) {
      throw new Error(`invalid_timeframe_${i}`)
    }
    if (typeof rec.rationale !== 'string' || !rec.rationale.trim()) {
      throw new Error(`missing_rationale_${i}`)
    }
    if (!Array.isArray(rec.actions) || rec.actions.length === 0) {
      throw new Error(`missing_actions_${i}`)
    }
    const validatedActions: StrategyAction[] = []
    for (let j = 0; j < rec.actions.length; j++) {
      const a = rec.actions[j] as Record<string, unknown>
      if (!a || typeof a.description !== 'string' || !a.description.trim()) {
        throw new Error(`invalid_action_${i}_${j}`)
      }
      validatedActions.push({
        description: a.description,
        owner_hint:
          typeof a.owner_hint === 'string' ? a.owner_hint : undefined,
      })
    }
    if (
      !Array.isArray(rec.kpi_suggestions) ||
      rec.kpi_suggestions.length === 0
    ) {
      throw new Error(`missing_kpis_${i}`)
    }
    const validatedKpis: KpiSuggestion[] = []
    for (let j = 0; j < rec.kpi_suggestions.length; j++) {
      const k = rec.kpi_suggestions[j] as Record<string, unknown>
      if (
        !k ||
        typeof k.name !== 'string' ||
        !k.name.trim() ||
        typeof k.unit !== 'string' ||
        !k.unit.trim() ||
        typeof k.target_value !== 'number' ||
        !VALID_FREQUENCY.includes(k.frequency as Frequency)
      ) {
        throw new Error(`invalid_kpi_${i}_${j}`)
      }
      validatedKpis.push({
        name: k.name,
        unit: k.unit,
        target_value: k.target_value,
        frequency: k.frequency as Frequency,
      })
    }
    items.push({
      strategy_title: rec.strategy_title,
      strategy_statement: rec.strategy_statement,
      bsc_perspective: rec.bsc_perspective as BscPerspective,
      timeframe: rec.timeframe as Timeframe,
      rationale: rec.rationale,
      actions: validatedActions,
      kpi_suggestions: validatedKpis,
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

    const rl = await requireAiRateLimit(user.id, { bucket: 'swot', limit: 50 })
    if (!rl.ok) return rl.response

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
      try {
        items = await callStrategiesAI(client, prompt)
      } catch (secondErr) {
        const secondReason = (secondErr as Error).message
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
          ai_prompt_used: prompt,
          actions: (item.actions ?? null) as unknown as Json,
          kpi_suggestions: (item.kpi_suggestions ?? null) as unknown as Json,
          timeframe: item.timeframe ?? null,
          rationale: item.rationale ?? null,
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

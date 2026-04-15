import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getSynthesisPrompt } from '@/lib/discovery/prompts'
import type { XMatrixPrefill } from '@/lib/discovery/types'
import type { Json } from '@/lib/supabase/types'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'
import { parseBody, discoverySynthesisSchema } from '@/lib/validation'

export const maxDuration = 60

const XMATRIX_TOOL: Anthropic.Tool = {
  name: 'build_xmatrix_prefill',
  description:
    'Submit a complete X-Matrix pre-fill after synthesizing Discovery data (SWOT + Pain + Vision + KPIs).',
  input_schema: {
    type: 'object',
    properties: {
      vision: { type: 'string' },
      yearGoals: { type: 'array', items: { type: 'string' } },
      hoshinCandidates: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            sourceType: { type: 'string', enum: ['pain', 'swot', 'ai'] },
            swotLinks: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'title', 'description', 'sourceType', 'swotLinks'],
        },
      },
      initiatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hoshinId: { type: 'string' },
            title: { type: 'string' },
            timeframe: { type: 'string', enum: ['30d', '60d', '90d'] },
          },
          required: ['id', 'hoshinId', 'title', 'timeframe'],
        },
      },
      kpiSuggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            hoshinId: { type: 'string' },
            name: { type: 'string' },
            unit: { type: 'string' },
            targetValue: { type: 'number' },
            frequency: { type: 'string', enum: ['weekly', 'monthly'] },
            dept_level: { type: 'string', enum: ['company', 'dept'] },
          },
          required: [
            'hoshinId',
            'name',
            'unit',
            'targetValue',
            'frequency',
            'dept_level',
          ],
        },
      },
      discoveryCompleteness: { type: 'number' },
      warnings: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'vision',
      'yearGoals',
      'hoshinCandidates',
      'initiatives',
      'kpiSuggestions',
      'discoveryCompleteness',
      'warnings',
    ],
  },
}

async function callSynthesisAI(
  client: Anthropic,
  prompt: string,
): Promise<XMatrixPrefill> {
  const response = await client.messages.create({
    model: AI_MODELS.reasoning,
    // 5 Hoshins × (3 initiatives + 2 KPIs + description) in Vietnamese plus
    // JSON/schema overhead easily pushes past 4096. 8192 gives headroom so
    // tool_use output doesn't truncate and trigger a retry/parse loop.
    max_tokens: 8192,
    tools: [XMATRIX_TOOL],
    tool_choice: { type: 'tool', name: 'build_xmatrix_prefill' },
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    console.error(
      '[discovery-synthesis] hit max_tokens before completing tool call',
    )
    throw new Error('max_tokens')
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    console.error(
      '[discovery-synthesis] no tool_use block. stop_reason=',
      response.stop_reason,
      'content:',
      JSON.stringify(response.content).slice(0, 800),
    )
    throw new Error('no_tool_use')
  }

  const parsed = toolBlock.input as Partial<XMatrixPrefill>

  if (typeof parsed.vision !== 'string' || !parsed.vision.trim()) {
    throw new Error('missing_vision')
  }
  if (
    !Array.isArray(parsed.hoshinCandidates) ||
    parsed.hoshinCandidates.length === 0
  ) {
    throw new Error('missing_hoshinCandidates')
  }
  if (!Array.isArray(parsed.initiatives)) {
    throw new Error('missing_initiatives')
  }
  if (!Array.isArray(parsed.kpiSuggestions)) {
    throw new Error('missing_kpiSuggestions')
  }

  return {
    vision: parsed.vision,
    yearGoals: Array.isArray(parsed.yearGoals) ? parsed.yearGoals : [],
    hoshinCandidates: parsed.hoshinCandidates,
    initiatives: parsed.initiatives,
    kpiSuggestions: parsed.kpiSuggestions,
    generatedAt: new Date().toISOString(),
    discoveryCompleteness:
      typeof parsed.discoveryCompleteness === 'number'
        ? parsed.discoveryCompleteness
        : 0,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bodyParsed = await parseBody(request, discoverySynthesisSchema)
  if (!bodyParsed.ok) return bodyParsed.response
  const { orgId, orgContext, selectedKpis } = bodyParsed.data

  // ============================================================
  // DATA GUARDS — check what's available before calling AI
  // ============================================================

  const dataWarnings: string[] = []

  const { data: swotItems, count: swotCount } = await supabase
    .from('swot_analyses')
    .select('quadrant, statement, implication, framework_source', {
      count: 'exact',
    })
    .eq('org_id', orgId)

  if ((swotCount ?? 0) === 0) {
    dataWarnings.push('swot_analyses')
  }

  const { data: coachingSession } = await supabase
    .from('discovery_sessions')
    .select('data_json')
    .eq('org_id', orgId)
    .eq('step_completed', 'swot_coaching')
    .maybeSingle()

  if (!coachingSession?.data_json) {
    dataWarnings.push('swot_coaching')
  }

  const { data: painSession } = await supabase
    .from('discovery_sessions')
    .select('data_json')
    .eq('org_id', orgId)
    .eq('step_completed', 'pain_mapper')
    .maybeSingle()

  const { data: visionSession } = await supabase
    .from('discovery_sessions')
    .select('data_json')
    .eq('org_id', orgId)
    .eq('step_completed', 'vision')
    .maybeSingle()

  const hasVision = !!visionSession?.data_json
  const hasPain = !!painSession?.data_json

  if (!hasVision || !hasPain) {
    return NextResponse.json(
      {
        error: 'Cần hoàn thành Pain Mapper và Vision Workshop trước',
        missing: { vision: !hasVision, painMapper: !hasPain },
      },
      { status: 400 },
    )
  }

  const visionData = visionSession.data_json as {
    finalVision: string
    finalGoals: string[]
  }

  const painData = painSession.data_json as {
    candidates: Array<{
      hoshin: string
      rationale: string
      priority: string
    }>
  }

  // ============================================================
  // CALL AI — tool_use + retry once on parse/validation failure
  // ============================================================

  const prompt = getSynthesisPrompt(
    orgContext,
    (swotItems ?? []).map((s) => ({
      ...s,
      implication: s.implication ?? '',
    })),
    painData.candidates ?? [],
    visionData,
    selectedKpis,
  )

  const client = createAnthropicClient()
  let prefill: XMatrixPrefill
  let firstReason = ''
  try {
    prefill = await callSynthesisAI(client, prompt)
  } catch (firstErr) {
    firstReason = (firstErr as Error).message
    console.warn('[discovery-synthesis] first attempt failed:', firstReason)
    try {
      prefill = await callSynthesisAI(client, prompt)
    } catch (secondErr) {
      const secondReason = (secondErr as Error).message
      console.error('[discovery-synthesis] retry also failed:', secondReason)
      return NextResponse.json(
        {
          error: `AI trả về định dạng không hợp lệ (${secondReason}). Thử lại.`,
          debug: { firstReason, secondReason },
        },
        { status: 500 },
      )
    }
  }

  // ============================================================
  // SAVE — soft-fail so user still sees the prefill
  // ============================================================

  let savedSuccessfully = true
  let saveWarning: string | null = null

  try {
    await supabase
      .from('discovery_sessions')
      .delete()
      .eq('org_id', orgId)
      .eq('step_completed', 'synthesis')

    const { error: insertError } = await supabase
      .from('discovery_sessions')
      .insert({
        org_id: orgId,
        user_id: user.id,
        step_completed: 'synthesis',
        data_json: {
          prefill,
          readyForXMatrix: true,
          synthesisAt: new Date().toISOString(),
        } as unknown as Json,
      })

    if (insertError) {
      savedSuccessfully = false
      saveWarning = 'Không thể lưu kết quả, vui lòng thử lại'
      console.error('[discovery-synthesis] insert failed', {
        orgId,
        error: insertError.message,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (saveErr) {
    savedSuccessfully = false
    saveWarning = 'Không thể lưu kết quả, vui lòng thử lại'
    console.error('[discovery-synthesis] save threw exception', {
      orgId,
      error: saveErr,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({
    prefill,
    savedSuccessfully,
    warning: saveWarning,
    dataWarnings,
  })
}

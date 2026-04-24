import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import { classifyAIError } from '@/lib/ai/classify-error'
import {
  getDraftSystemPrompt,
  buildDraftUserPrompt,
} from '@/lib/swot/coaching-draft-prompt'
import { AI_MODELS } from '@/lib/ai/models'
import type {
  SwotContextInput,
  SwotDraft,
  SwotDraftItem,
  AnalysisFramework,
} from '@/lib/swot/coaching-types'
import { parseBody, swotCoachingDraftSchema } from '@/lib/validation'

interface RawDraftItem {
  statement: string
  rationale: string
  frameworkSource: AnalysisFramework
  confidence: 'high' | 'medium' | 'low'
}

interface RawDraftOutput {
  strengths: RawDraftItem[]
  weaknesses: RawDraftItem[]
  opportunities: RawDraftItem[]
  threats: RawDraftItem[]
}

function hydrateItems(raw: RawDraftItem[]): SwotDraftItem[] {
  return raw.map((item) => ({
    id: crypto.randomUUID(),
    statement: item.statement,
    rationale: item.rationale,
    frameworkSource: item.frameworkSource,
    confidence: item.confidence,
    isUserAdded: false,
  }))
}

function quadrantError(arr: unknown): string | null {
  if (!Array.isArray(arr)) return `not-array (got ${typeof arr})`
  if (arr.length < 2) return `too-few-items (${arr.length})`
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (typeof item !== 'object' || item === null) return `item[${i}] not-object`
    const rec = item as Record<string, unknown>
    if (typeof rec.statement !== 'string' || rec.statement.trim().length === 0)
      return `item[${i}] missing-statement`
    if (typeof rec.rationale !== 'string' || rec.rationale.trim().length === 0)
      return `item[${i}] missing-rationale`
  }
  return null
}

const QUADRANT_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    statement: {
      type: 'string',
      description: 'Câu hoàn chỉnh tiếng Việt, cụ thể với ngành',
    },
    rationale: {
      type: 'string',
      description: 'Một câu giải thích ngắn lý do',
    },
    frameworkSource: {
      type: 'string',
      enum: ['8Ms', '5Forces', 'PESTEL'],
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: ['statement', 'rationale', 'frameworkSource', 'confidence'],
} as const

const SWOT_TOOL: Anthropic.Tool = {
  name: 'submit_swot_draft',
  description:
    'Submit a complete SWOT analysis draft with 3-5 items per quadrant.',
  input_schema: {
    type: 'object',
    properties: {
      strengths: {
        type: 'array',
        items: QUADRANT_ITEM_SCHEMA,
        minItems: 3,
        maxItems: 5,
      },
      weaknesses: {
        type: 'array',
        items: QUADRANT_ITEM_SCHEMA,
        minItems: 3,
        maxItems: 5,
      },
      opportunities: {
        type: 'array',
        items: QUADRANT_ITEM_SCHEMA,
        minItems: 3,
        maxItems: 5,
      },
      threats: {
        type: 'array',
        items: QUADRANT_ITEM_SCHEMA,
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ['strengths', 'weaknesses', 'opportunities', 'threats'],
  },
}

async function callDraftAI(
  client: Anthropic,
  prompt: string,
): Promise<RawDraftOutput> {
  const response = await client.messages.create({
    model: AI_MODELS.reasoning,
    // 4 quadrants × 3-5 items × (statement + rationale + metadata) in
    // Vietnamese easily pushes past 4k tokens once JSON/schema overhead is
    // counted. 4096 was truncating tool_use output on Sonnet 4.6 and
    // triggering the "định dạng không hợp lệ" toast. 8192 is comfortable.
    max_tokens: 8192,
    system: getDraftSystemPrompt(),
    tools: [SWOT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_swot_draft' },
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

  const parsed = toolBlock.input as RawDraftOutput

  const errors: string[] = []
  const sErr = quadrantError(parsed.strengths)
  if (sErr) errors.push(`S:${sErr}`)
  const wErr = quadrantError(parsed.weaknesses)
  if (wErr) errors.push(`W:${wErr}`)
  const oErr = quadrantError(parsed.opportunities)
  if (oErr) errors.push(`O:${oErr}`)
  const tErr = quadrantError(parsed.threats)
  if (tErr) errors.push(`T:${tErr}`)

  if (errors.length > 0) {
    const summary = errors.join(', ')
    throw new Error(`invalid_quadrants: ${summary}`)
  }

  return parsed
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bodyParsed = await parseBody(request, swotCoachingDraftSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const body = bodyParsed.data as unknown as SwotContextInput

    const client = createAnthropicClient()
    const prompt = buildDraftUserPrompt(body)

    let aiResult: RawDraftOutput
    try {
      aiResult = await callDraftAI(client, prompt)
    } catch (firstErr) {
      if (!isRecoverableDraftError(firstErr)) throw firstErr
      const firstReason = (firstErr as Error).message
      try {
        aiResult = await callDraftAI(client, prompt)
      } catch (secondErr) {
        if (!isRecoverableDraftError(secondErr)) throw secondErr
        const secondReason = (secondErr as Error).message
        return NextResponse.json(
          {
            error: 'AI tạo bản nháp chưa đạt định dạng. Thử lại sau ít phút.',
            code: 'invalid_output',
            debug: { firstReason, secondReason },
          },
          { status: 500 }
        )
      }
    }

    const draft: SwotDraft = {
      strengths: hydrateItems(aiResult.strengths),
      weaknesses: hydrateItems(aiResult.weaknesses),
      opportunities: hydrateItems(aiResult.opportunities),
      threats: hydrateItems(aiResult.threats),
      generatedAt: new Date().toISOString(),
      frameworksUsed: body.selectedFrameworks,
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('[coaching-draft] error:', error)
    const classified = classifyAIError(error, 'AI')
    return NextResponse.json(classified, { status: classified.status })
  }
}

function isRecoverableDraftError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message
  return (
    msg === 'max_tokens' ||
    msg === 'no_tool_use' ||
    msg.startsWith('invalid_quadrants:')
  )
}

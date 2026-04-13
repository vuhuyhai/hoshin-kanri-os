import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
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

function isValidQuadrant(arr: unknown): arr is RawDraftItem[] {
  return Array.isArray(arr) && arr.length >= 2 && arr.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).statement === 'string' &&
      typeof (item as Record<string, unknown>).rationale === 'string'
  )
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
    max_tokens: 4096,
    system: getDraftSystemPrompt(),
    tools: [SWOT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_swot_draft' },
    messages: [{ role: 'user', content: prompt }],
  })

  if (response.stop_reason === 'max_tokens') {
    console.error('[coaching-draft] AI hit max_tokens before completing tool call')
    throw new Error('max_tokens')
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    console.error(
      '[coaching-draft] No tool_use block in response. stop_reason=',
      response.stop_reason,
      'content:',
      JSON.stringify(response.content).slice(0, 800),
    )
    throw new Error('no_tool_use')
  }

  const parsed = toolBlock.input as RawDraftOutput

  if (
    !isValidQuadrant(parsed.strengths) ||
    !isValidQuadrant(parsed.weaknesses) ||
    !isValidQuadrant(parsed.opportunities) ||
    !isValidQuadrant(parsed.threats)
  ) {
    console.error(
      '[coaching-draft] quadrant validation failed. parsed:',
      JSON.stringify(parsed).slice(0, 1000),
    )
    throw new Error('invalid_quadrants')
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

    const body: SwotContextInput = await request.json()

    if (
      !body.orgName ||
      !body.industry ||
      !body.topChallenges ||
      !body.currentStrengths ||
      !body.breakthroughGoal ||
      !body.selectedFrameworks?.length
    ) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const client = new Anthropic()
    const prompt = buildDraftUserPrompt(body)

    let parsed: RawDraftOutput
    try {
      parsed = await callDraftAI(client, prompt)
    } catch {
      // Retry once on any parse/validation/truncation failure
      try {
        parsed = await callDraftAI(client, prompt)
      } catch {
        return NextResponse.json(
          { error: 'AI trả về định dạng không hợp lệ, vui lòng thử lại' },
          { status: 500 }
        )
      }
    }

    const draft: SwotDraft = {
      strengths: hydrateItems(parsed.strengths),
      weaknesses: hydrateItems(parsed.weaknesses),
      opportunities: hydrateItems(parsed.opportunities),
      threats: hydrateItems(parsed.threats),
      generatedAt: new Date().toISOString(),
      frameworksUsed: body.selectedFrameworks,
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Coaching draft API error:', error)
    return NextResponse.json(
      { error: 'Không thể kết nối AI. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}

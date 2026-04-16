import { NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { SwotQuadrant } from '@/lib/swot/types'
import { buildQualityCheckPrompt } from '@/lib/swot/tows-prompts'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'

interface QualityAssessment {
  score: number
  feedback: string
  improved: string | null
}

const QUALITY_TOOL: Anthropic.Tool = {
  name: 'submit_quality_assessment',
  description:
    'Submit quality score, feedback, and optional improved version for a SWOT factor.',
  input_schema: {
    type: 'object',
    properties: {
      score: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: '1-5 điểm đánh giá chất lượng',
      },
      feedback: {
        type: 'string',
        description: 'Nhận xét ngắn gọn về chất lượng',
      },
      improved: {
        type: 'string',
        description:
          'Phiên bản cải thiện (để trống nếu yếu tố đã tốt, score >= 4)',
      },
    },
    required: ['score', 'feedback'],
  },
}

async function callQualityAI(
  client: Anthropic,
  prompt: string,
): Promise<QualityAssessment> {
  const response = await client.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 512,
    tools: [QUALITY_TOOL],
    tool_choice: { type: 'tool', name: 'submit_quality_assessment' },
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

  const parsed = toolBlock.input as {
    score?: unknown
    feedback?: unknown
    improved?: unknown
  }

  const score = Number(parsed.score)
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error('invalid_score')
  }
  if (typeof parsed.feedback !== 'string' || !parsed.feedback.trim()) {
    throw new Error('missing_feedback')
  }

  const improved =
    typeof parsed.improved === 'string' && parsed.improved.trim()
      ? parsed.improved
      : null

  return { score, feedback: parsed.feedback, improved }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; factorId: string }> },
) {
  try {
    const { factorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: factor } = await supabase
      .from('swot_factors')
      .select('id, org_id, content, quadrant')
      .eq('id', factorId)
      .single()
    if (!factor) return NextResponse.json({ error: 'Yếu tố không tồn tại' }, { status: 404 })

    const check = await requireOrgRole(supabase, user.id, factor.org_id, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const prompt = buildQualityCheckPrompt(
      factor.content,
      factor.quadrant as SwotQuadrant,
    )

    const client = createAnthropicClient()
    let result: QualityAssessment
    try {
      result = await callQualityAI(client, prompt)
    } catch (firstErr) {
      const firstReason = (firstErr as Error).message
      try {
        result = await callQualityAI(client, prompt)
      } catch (secondErr) {
        const secondReason = (secondErr as Error).message
        return NextResponse.json(
          { error: `AI trả về định dạng không hợp lệ (${secondReason}). Thử lại.` },
          { status: 500 },
        )
      }
    }

    await supabase
      .from('swot_factors')
      .update({ quality_score: result.score })
      .eq('id', factorId)

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi đánh giá chất lượng'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

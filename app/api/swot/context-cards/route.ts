import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { ContextCardsOutput } from '@/lib/swot/types'
import type { SwotContextCardsInput } from '@/lib/validation/schemas'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'
import { parseBody, swotContextCardsSchema } from '@/lib/validation'

const CONTEXT_CARDS_SYSTEM_PROMPT = `
Bạn là chuyên gia phân tích thị trường cho SME Việt Nam.

Dựa trên profile doanh nghiệp và kết quả coaching, hãy tổng hợp bối cảnh bên ngoài
để bổ sung cho phân tích SWOT.

TẠO ĐÚNG 6 CONTEXT CARDS:
- 3 cards cho Opportunities (swot_quadrant: "O")
- 3 cards cho Threats (swot_quadrant: "T")

MỖI CARD phải:
- Liên quan trực tiếp đến ngành và quy mô của doanh nghiệp
- Có insight cụ thể (không chung chung như "thị trường đang phát triển")
- Viết bằng tiếng Việt

OUTPUT: Chỉ JSON hợp lệ, không markdown.
{
  "cards": [
    {
      "id": "card_1",
      "title": "...",
      "insight": "...",
      "card_type": "market_trend",
      "swot_quadrant": "O",
      "relevance_score": 0.85
    }
  ],
  "generated_at": "<ISO timestamp>"
}
`

function buildContextCardsUserPrompt(
  orgContext: SwotContextCardsInput['orgContext'],
  coachingSummary: string
): string {
  return `
Doanh nghiệp:
- Ngành: ${orgContext.industry}
- Quy mô: ${orgContext.headcount} nhân viên
- Khu vực: ${orgContext.city}

Tóm tắt từ coaching session:
${coachingSummary}

Hãy tạo 6 context cards phù hợp với bối cảnh này.
  `.trim()
}

function parseContextCardsResponse(raw: string): ContextCardsOutput {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleaned) as ContextCardsOutput

  return {
    cards: (parsed.cards ?? []).slice(0, 6),
    generated_at: parsed.generated_at ?? new Date().toISOString(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, swotContextCardsSchema)
    if (!parsed.ok) return parsed.response
    const { summary, orgContext } = parsed.data

    const coachingSummary = [
      'Điểm mạnh: ' + summary.strengths.map((s) => s.content).join('; '),
      'Điểm yếu: ' + summary.weaknesses.map((s) => s.content).join('; '),
      'Cơ hội: ' + summary.opportunities.map((s) => s.content).join('; '),
      'Thách thức: ' + summary.threats.map((s) => s.content).join('; '),
    ].join('\n')

    const userPrompt = buildContextCardsUserPrompt(orgContext, coachingSummary)

    const client = createAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 2000,
      system: CONTEXT_CARDS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const result = parseContextCardsResponse(text)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Context cards error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo context cards. Thử lại.' },
      { status: 500 }
    )
  }
}

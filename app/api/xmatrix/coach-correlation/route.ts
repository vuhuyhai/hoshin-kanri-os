import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import { AI_MODELS } from '@/lib/ai/models'
import { requireAiRateLimit } from '@/lib/ai/rate-limit-helper'
import { parseBody, coachCorrelationSchema } from '@/lib/validation'

const SENSEI_REST = 'Sensei đang nghỉ. Thử lại sau nhé.'

const SENSEI_SYSTEM_PROMPT = `Bạn là sensei Hoshin Kanri theo triết lý Toyota. Vai trò: KHÔNG giải thích — mà CHALLENGE người dùng suy nghĩ sâu hơn về quyết định liên kết Hoshin với Year Goal.

Phong cách:
- Đặt câu hỏi sắc bén, cụ thể với Hoshin và Year Goal được nêu (không generic)
- Mỗi câu một góc nhìn khác: rủi ro / alternative / evidence / ownership / timeline
- Sensei không nịnh, không soft
- Tiếng Việt, mỗi câu dưới 30 chữ

Trả lời CHỈ JSON, không markdown, không lời mở đầu:
{"questions": ["câu 1", "câu 2", "câu 3"]}`

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = await requireAiRateLimit(user.id, { bucket: 'coach', limit: 50 })
    if (!rl.ok) return rl.response

    const bodyParsed = await parseBody(request, coachCorrelationSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { yearGoalTitle, hoshinTitle, visionContext } = bodyParsed.data

    const userPrompt = `Year Goal: ${yearGoalTitle}
Hoshin: ${hoshinTitle}
Vision context: ${visionContext && visionContext.trim().length > 0 ? visionContext : 'Chưa có'}

User vừa đánh dấu Hoshin này có liên kết MẠNH (●) với Year Goal. Đặt 3 câu hỏi tò mò giúp user verify quyết định.`

    const client = createAnthropicClient()
    const response = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 2000,
      system: SENSEI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const start = text.indexOf('{')
    const end = text.lastIndexOf('}') + 1
    if (start === -1 || end <= start) {
      console.error(
        `[coach-correlation:${requestId}] no JSON found in AI output`,
        text,
      )
      return NextResponse.json(
        { error: SENSEI_REST, requestId },
        { status: 502 },
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text.slice(start, end))
    } catch (err) {
      console.error(
        `[coach-correlation:${requestId}] JSON parse failed`,
        err,
        text,
      )
      return NextResponse.json(
        { error: SENSEI_REST, requestId },
        { status: 502 },
      )
    }

    const questions = (parsed as { questions?: unknown }).questions
    if (
      !Array.isArray(questions) ||
      questions.length !== 3 ||
      !questions.every(
        (q): q is string => typeof q === 'string' && q.trim().length > 0,
      )
    ) {
      console.error(
        `[coach-correlation:${requestId}] invalid questions shape`,
        parsed,
      )
      return NextResponse.json(
        { error: SENSEI_REST, requestId },
        { status: 502 },
      )
    }

    return NextResponse.json({ questions })
  } catch (err) {
    console.error(`[coach-correlation:${requestId}]`, err)
    return NextResponse.json(
      { error: SENSEI_REST, requestId },
      { status: 500 },
    )
  }
}

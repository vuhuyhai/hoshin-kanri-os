import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import {
  getDraftSystemPrompt,
  buildSuggestMorePrompt,
} from '@/lib/swot/coaching-draft-prompt'
import { AI_MODELS } from '@/lib/ai/models'
import type {
  SuggestMoreRequest,
  SuggestMoreResponse,
  AnalysisFramework,
} from '@/lib/swot/coaching-types'
import { parseBody, swotSuggestMoreSchema } from '@/lib/validation'

interface RawSuggestItem {
  statement: string
  rationale: string
  frameworkSource: AnalysisFramework
  confidence: 'high' | 'medium' | 'low'
}

function isValidItems(arr: unknown): arr is RawSuggestItem[] {
  return (
    Array.isArray(arr) &&
    arr.length >= 1 &&
    arr.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).statement === 'string' &&
        typeof (item as Record<string, unknown>).rationale === 'string'
    )
  )
}

async function callAI(prompt: string): Promise<RawSuggestItem[]> {
  const client = createAnthropicClient()
  const response = await client.messages.create({
    model: AI_MODELS.reasoning,
    max_tokens: 800,
    system: getDraftSystemPrompt(),
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  let jsonText = rawText.trim()
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) jsonText = fenceMatch[1].trim()

  const parsed = JSON.parse(jsonText) as { items: RawSuggestItem[] }
  if (!isValidItems(parsed.items)) {
    throw new Error('Invalid items format')
  }
  return parsed.items
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, swotSuggestMoreSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data as unknown as SuggestMoreRequest

    const prompt = buildSuggestMorePrompt(body)

    let items: RawSuggestItem[]
    try {
      items = await callAI(prompt)
    } catch {
      // Retry once on parse failure
      try {
        items = await callAI(prompt)
      } catch {
        return NextResponse.json(
          { error: 'AI trả về định dạng không hợp lệ, thử lại' },
          { status: 500 }
        )
      }
    }

    const result: SuggestMoreResponse = { items }
    return NextResponse.json(result)
  } catch (error) {
    if (
      error instanceof Error &&
      'status' in error &&
      (error as { status: number }).status === 429
    ) {
      return NextResponse.json(
        { error: 'Đang tải nhiều, thử lại sau vài giây' },
        { status: 429 }
      )
    }
    console.error('Suggest-more API error:', error)
    return NextResponse.json(
      { error: 'Không thể kết nối AI. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getVisionDraftPrompt } from '@/lib/discovery/prompts'
import type { VisionDraftRequest, VisionDraftResponse } from '@/lib/discovery/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: VisionDraftRequest = await request.json()
    const { answers, orgContext } = body

    const answeredCount = Object.values(answers).filter(
      (v) => v.trim().length > 10
    ).length
    if (answeredCount < 3) {
      return NextResponse.json(
        { error: 'Cần trả lời ít nhất 3 câu hỏi' },
        { status: 400 }
      )
    }

    const prompt = getVisionDraftPrompt(answers, orgContext)
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    const result: VisionDraftResponse = { draft: parsed }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Vision draft error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo Vision draft.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  getSwCoachingSystemPrompt,
  getOtCoachingSystemPrompt,
} from '@/lib/swot/coaching-prompts'
import type { CoachingRequest, CoachingResponse } from '@/lib/swot/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: CoachingRequest = await request.json()
    const { messages, orgContext, currentFramework } = body

    if (!messages || !orgContext) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const systemPrompt =
      currentFramework === 'sw'
        ? getSwCoachingSystemPrompt(orgContext)
        : getOtCoachingSystemPrompt(orgContext)

    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const assistantMessage = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const isSwComplete =
      currentFramework === 'sw' && assistantMessage.includes('[SW_COMPLETE]')
    const isOtComplete =
      currentFramework === 'ot' && assistantMessage.includes('[OT_COMPLETE]')
    const isCoachingComplete = isSwComplete || isOtComplete

    const cleanMessage = assistantMessage
      .replace('[SW_COMPLETE]', '')
      .replace('[OT_COMPLETE]', '')
      .trim()

    const result: CoachingResponse = {
      message: { role: 'assistant', content: cleanMessage },
      isCoachingComplete,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Coaching API error:', error)
    return NextResponse.json(
      { error: 'Không thể kết nối AI coach. Thử lại.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getPainMapperPrompt } from '@/lib/discovery/prompts'
import type { PainMapperRequest, PainMapperResponse } from '@/lib/discovery/types'
import type { Json } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: PainMapperRequest = await request.json()
    const { painPoints, orgContext } = body

    if (!painPoints || painPoints.length === 0) {
      return NextResponse.json(
        { error: 'Cần ít nhất 1 pain point' },
        { status: 400 }
      )
    }

    const prompt = getPainMapperPrompt(painPoints, orgContext)
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      await supabase.from('discovery_sessions').insert({
        org_id: membership.org_id,
        user_id: user.id,
        step_completed: 'pain_mapper',
        data_json: { painPoints, candidates: parsed.candidates } as unknown as Json,
      })
    }

    const result: PainMapperResponse = { candidates: parsed.candidates }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pain mapper error:', error)
    return NextResponse.json(
      { error: 'Không thể phân tích pain points.' },
      { status: 500 }
    )
  }
}

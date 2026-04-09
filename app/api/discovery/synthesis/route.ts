import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getSynthesisPrompt } from '@/lib/discovery/prompts'
import type {
  SynthesisRequest,
  SynthesisResponse,
  XMatrixPrefill,
} from '@/lib/discovery/types'
import type { Json } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: SynthesisRequest = await request.json()
    const { orgId, orgContext } = body

    // Pull all discovery data
    const { data: swotItems } = await supabase
      .from('swot_analyses')
      .select('quadrant, statement, implication, framework_source')
      .eq('org_id', orgId)

    const { data: painSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'pain_mapper')
      .single()

    const { data: visionSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'vision')
      .single()

    const hasVision = !!visionSession?.data_json
    const hasPain = !!painSession?.data_json

    if (!hasVision || !hasPain) {
      return NextResponse.json(
        {
          error: 'Cần hoàn thành Pain Mapper và Vision Workshop trước',
          missing: { vision: !hasVision, painMapper: !hasPain },
        },
        { status: 400 }
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

    const prompt = getSynthesisPrompt(
      orgContext,
      (swotItems ?? []).map(s => ({ ...s, implication: s.implication ?? '' })),
      painData.candidates ?? [],
      visionData,
      []
    )

    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const prefill: XMatrixPrefill = JSON.parse(
      text.replace(/```json|```/g, '').trim()
    )

    // Save synthesis result
    await supabase.from('discovery_sessions').insert({
      org_id: orgId,
      user_id: user.id,
      step_completed: 'vision',
      data_json: {
        ...visionData,
        synthesis: prefill,
        readyForXMatrix: true,
        synthesisAt: new Date().toISOString(),
      } as unknown as Json,
    })

    const result: SynthesisResponse = { prefill }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Không thể tổng hợp Discovery data.' },
      { status: 500 }
    )
  }
}

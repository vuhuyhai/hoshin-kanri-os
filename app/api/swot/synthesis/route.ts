import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  SWOT_SYNTHESIS_SYSTEM_PROMPT,
  buildSynthesisUserMessage,
} from '@/lib/swot/coaching-prompts'
import type {
  SynthesisRequest,
  SynthesisResponse,
  SwotSynthesisOutput,
  SwotQuadrant,
} from '@/lib/swot/types'

const MAX_ITEMS_PER_QUADRANT = 3

function parseSynthesisResponse(raw: string): SwotSynthesisOutput {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleaned) as SwotSynthesisOutput

  return {
    S: (parsed.S ?? []).slice(0, MAX_ITEMS_PER_QUADRANT),
    W: (parsed.W ?? []).slice(0, MAX_ITEMS_PER_QUADRANT),
    O: (parsed.O ?? []).slice(0, MAX_ITEMS_PER_QUADRANT),
    T: (parsed.T ?? []).slice(0, MAX_ITEMS_PER_QUADRANT),
    summary: parsed.summary ?? '',
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

    const body: SynthesisRequest = await request.json()
    const { summary, evidenceItems, orgContext } = body

    const coachingText = [
      'STRENGTHS:\n' +
        summary.strengths.map((s) => `- [${s.source}] ${s.content}`).join('\n'),
      'WEAKNESSES:\n' +
        summary.weaknesses
          .map((s) => `- [${s.source}] ${s.content}`)
          .join('\n'),
      'OPPORTUNITIES:\n' +
        summary.opportunities
          .map((s) => `- [${s.source}] ${s.content}`)
          .join('\n'),
      'THREATS:\n' +
        summary.threats.map((s) => `- [${s.source}] ${s.content}`).join('\n'),
    ].join('\n\n')

    const evidenceText = evidenceItems
      .filter((e) => e.source === 'Web')
      .map((e) => `- ${e.content}${e.url ? ` (${e.url})` : ''}`)
      .join('\n')

    const userMessage = buildSynthesisUserMessage(
      orgContext,
      coachingText,
      evidenceText
    )

    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SWOT_SYNTHESIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const synthesis = parseSynthesisResponse(text)

    // Save to Supabase
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      await supabase
        .from('swot_analyses')
        .delete()
        .eq('org_id', membership.org_id)

      const quadrants: SwotQuadrant[] = ['S', 'W', 'O', 'T']
      const insertData = quadrants.flatMap((q) =>
        synthesis[q].map((item) => ({
          org_id: membership.org_id,
          quadrant: q,
          framework_source: item.framework_source ?? '',
          statement: item.statement,
          evidence_json: [],
          implication: item.implication,
        }))
      )

      if (insertData.length > 0) {
        await supabase.from('swot_analyses').insert(insertData)
      }
    }

    const result: SynthesisResponse = { synthesis }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Không thể tổng hợp SWOT. Thử lại.' },
      { status: 500 }
    )
  }
}

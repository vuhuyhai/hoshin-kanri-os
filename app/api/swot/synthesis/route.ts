import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getSynthesisPrompt } from '@/lib/swot/coaching-prompts'
import type { SynthesisRequest, SynthesisResponse, SwotItem } from '@/lib/swot/types'

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

    const prompt = getSynthesisPrompt(orgContext, coachingText, evidenceText)

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

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

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

      const insertData = parsed.items.map(
        (item: SwotItem) => ({
          org_id: membership.org_id,
          quadrant: item.quadrant,
          framework_source: item.frameworkSource,
          statement: item.statement,
          evidence_json: item.evidence,
          implication: item.implication,
        })
      )

      await supabase.from('swot_analyses').insert(insertData)

      await supabase.from('discovery_sessions').insert({
        org_id: membership.org_id,
        user_id: user.id,
        step_completed: 'swot',
        data_json: { completedAt: new Date().toISOString() },
      })
    }

    const result: SynthesisResponse = { items: parsed.items }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Không thể tổng hợp SWOT. Thử lại.' },
      { status: 500 }
    )
  }
}

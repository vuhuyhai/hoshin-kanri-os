import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { SwotQuadrant } from '@/lib/swot/types'
import { buildQualityCheckPrompt } from '@/lib/swot/tows-prompts'
import { AI_MODELS } from '@/lib/ai/models'

const anthropic = new Anthropic()

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; factorId: string }> },
) {
  try {
    const { factorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch factor, then verify role (writes quality_score, so WRITE_ROLES).
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

    const message = await anthropic.messages.create({
      model: AI_MODELS.fast,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const result = JSON.parse(cleaned) as {
      score: number
      feedback: string
      improved: string | null
    }

    // Persist quality_score
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

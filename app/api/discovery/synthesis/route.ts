import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getSynthesisPrompt } from '@/lib/discovery/prompts'
import type {
  SynthesisRequest,
  XMatrixPrefill,
} from '@/lib/discovery/types'
import type { Json } from '@/lib/supabase/types'
import { AI_MODELS } from '@/lib/ai/models'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { orgId, orgContext } = body as SynthesisRequest

    const selectedKpis: Array<{
      name: string
      unit: string
      targetValue: number
      frequency: string
    }> = Array.isArray(body.selectedKpis) ? body.selectedKpis : []

    // ============================================================
    // DATA GUARDS — check what's available before calling AI
    // ============================================================

    const dataWarnings: string[] = []

    // Check swot_analyses
    const { data: swotItems, count: swotCount } = await supabase
      .from('swot_analyses')
      .select('quadrant, statement, implication, framework_source', {
        count: 'exact',
      })
      .eq('org_id', orgId)

    if ((swotCount ?? 0) === 0) {
      dataWarnings.push('swot_analyses')
    }

    // Check coaching data
    const { data: coachingSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'swot_coaching')
      .maybeSingle()

    if (!coachingSession?.data_json) {
      dataWarnings.push('swot_coaching')
    }

    // Check pain mapper + vision (hard requirements)
    const { data: painSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'pain_mapper')
      .maybeSingle()

    const { data: visionSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'vision')
      .maybeSingle()

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

    // ============================================================
    // CALL AI
    // ============================================================

    const prompt = getSynthesisPrompt(
      orgContext,
      (swotItems ?? []).map((s) => ({
        ...s,
        implication: s.implication ?? '',
      })),
      painData.candidates ?? [],
      visionData,
      selectedKpis
    )

    const client = new Anthropic()

    const response = await client.messages.create({
      model: AI_MODELS.reasoning,
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

    // ============================================================
    // SAVE — with proper error handling
    // ============================================================

    let savedSuccessfully = true
    let saveWarning: string | null = null

    try {
      await supabase
        .from('discovery_sessions')
        .delete()
        .eq('org_id', orgId)
        .eq('step_completed', 'synthesis')

      const { error: insertError } = await supabase
        .from('discovery_sessions')
        .insert({
          org_id: orgId,
          user_id: user.id,
          step_completed: 'synthesis',
          data_json: {
            prefill,
            readyForXMatrix: true,
            synthesisAt: new Date().toISOString(),
          } as unknown as Json,
        })

      if (insertError) {
        savedSuccessfully = false
        saveWarning =
          'Khong the luu ket qua, vui long thu lai'
        console.error('[Synthesis] Failed to save to discovery_sessions', {
          orgId,
          step: 'synthesis',
          error: insertError.message,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (saveErr) {
      savedSuccessfully = false
      saveWarning = 'Khong the luu ket qua, vui long thu lai'
      console.error('[Synthesis] Save threw exception', {
        orgId,
        step: 'synthesis',
        error: saveErr,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      prefill,
      savedSuccessfully,
      warning: saveWarning,
      dataWarnings,
    })
  } catch (error) {
    console.error('Synthesis error:', error)
    return NextResponse.json(
      { error: 'Khong the tong hop Discovery data.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import {
  getDraftSystemPrompt,
  buildDraftUserPrompt,
} from '@/lib/swot/coaching-draft-prompt'
import { AI_MODELS } from '@/lib/ai/models'
import type {
  SwotContextInput,
  SwotDraft,
  SwotDraftItem,
  AnalysisFramework,
} from '@/lib/swot/coaching-types'

interface RawDraftItem {
  statement: string
  rationale: string
  frameworkSource: AnalysisFramework
  confidence: 'high' | 'medium' | 'low'
}

interface RawDraftOutput {
  strengths: RawDraftItem[]
  weaknesses: RawDraftItem[]
  opportunities: RawDraftItem[]
  threats: RawDraftItem[]
}

function hydrateItems(raw: RawDraftItem[]): SwotDraftItem[] {
  return raw.map((item) => ({
    id: crypto.randomUUID(),
    statement: item.statement,
    rationale: item.rationale,
    frameworkSource: item.frameworkSource,
    confidence: item.confidence,
    isUserAdded: false,
  }))
}

function isValidQuadrant(arr: unknown): arr is RawDraftItem[] {
  return Array.isArray(arr) && arr.length >= 2 && arr.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).statement === 'string' &&
      typeof (item as Record<string, unknown>).rationale === 'string'
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: SwotContextInput = await request.json()

    if (
      !body.orgName ||
      !body.industry ||
      !body.topChallenges ||
      !body.currentStrengths ||
      !body.breakthroughGoal ||
      !body.selectedFrameworks?.length
    ) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const client = new Anthropic()
    const xrayHint = body.xrayContext?.summaryForAI
      ? `\n\nDỮ LIỆU CHẨN ĐOÁN (Business X-Ray):\n${body.xrayContext.summaryForAI}`
      : ''

    const response = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 2000,
      system: getDraftSystemPrompt(),
      messages: [
        { role: 'user', content: buildDraftUserPrompt(body) + xrayHint },
      ],
    })

    const rawText = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      )
      .map((block) => block.text)
      .join('')

    // Strip markdown fences if present
    let jsonText = rawText.trim()
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonText = fenceMatch[1].trim()

    let parsed: RawDraftOutput
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: 'AI trả về định dạng không hợp lệ, vui lòng thử lại' },
        { status: 500 }
      )
    }

    // Validate each quadrant has at least 2 items
    if (
      !isValidQuadrant(parsed.strengths) ||
      !isValidQuadrant(parsed.weaknesses) ||
      !isValidQuadrant(parsed.opportunities) ||
      !isValidQuadrant(parsed.threats)
    ) {
      return NextResponse.json(
        { error: 'AI trả về định dạng không hợp lệ, vui lòng thử lại' },
        { status: 500 }
      )
    }

    const draft: SwotDraft = {
      strengths: hydrateItems(parsed.strengths),
      weaknesses: hydrateItems(parsed.weaknesses),
      opportunities: hydrateItems(parsed.opportunities),
      threats: hydrateItems(parsed.threats),
      generatedAt: new Date().toISOString(),
      frameworksUsed: body.selectedFrameworks,
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Coaching draft API error:', error)
    return NextResponse.json(
      { error: 'Không thể kết nối AI. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}

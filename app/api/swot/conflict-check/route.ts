import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildConflictCheckPrompt, getDraftSystemPrompt } from '@/lib/swot/coaching-draft-prompt'
import type { SwotDraft, ConflictCheckResult, ConflictIssue, QuadrantKey } from '@/lib/swot/coaching-types'

const VALID_QUADRANTS: QuadrantKey[] = ['strengths', 'weaknesses', 'opportunities', 'threats']

function collectAllIds(draft: SwotDraft): Set<string> {
  const ids = new Set<string>()
  for (const q of VALID_QUADRANTS) {
    for (const item of draft[q]) ids.add(item.id)
  }
  return ids
}

function failSafe(): ConflictCheckResult {
  return { hasIssues: false, issues: [], checkedAt: new Date().toISOString() }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { draft }: { draft: SwotDraft } = await request.json()

    // Validate draft has items in all quadrants
    const hasItems = VALID_QUADRANTS.every((q) => draft[q]?.length >= 1)
    if (!hasItems) return NextResponse.json(failSafe())

    const prompt = buildConflictCheckPrompt(draft)
    const client = new Anthropic()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let response: Anthropic.Message
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: getDraftSystemPrompt(),
        messages: [{ role: 'user', content: prompt }],
      })
    } catch {
      clearTimeout(timeout)
      return NextResponse.json(failSafe())
    }
    clearTimeout(timeout)

    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    let jsonText = rawText.trim()
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) jsonText = fenceMatch[1].trim()

    let parsed: { issues: ConflictIssue[] }
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(failSafe())
    }

    if (!Array.isArray(parsed.issues)) return NextResponse.json(failSafe())

    // Filter out issues with hallucinated item IDs
    const validIds = collectAllIds(draft)
    const validIssues = parsed.issues.filter((issue) =>
      issue.affectedItems?.every(
        (ai) =>
          VALID_QUADRANTS.includes(ai.quadrant) && validIds.has(ai.itemId)
      )
    )

    const result: ConflictCheckResult = {
      hasIssues: validIssues.length > 0,
      issues: validIssues,
      checkedAt: new Date().toISOString(),
    }
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 429) {
      return NextResponse.json({ error: 'Đang tải nhiều, thử lại sau' }, { status: 429 })
    }
    console.error('Conflict-check API error:', error)
    return NextResponse.json(failSafe())
  }
}

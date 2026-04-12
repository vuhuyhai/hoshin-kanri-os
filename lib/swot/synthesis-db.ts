import { createClient } from '@/lib/supabase/client'
import {
  draftToCoachingItems,
  contextCardsToEvidence,
  synthesisResultToOutput,
} from './synthesis-helpers'
import type { SwotSynthesisOutput, SynthesisResult, ContextCard } from './types'
import type { SwotDraft, SwotDraftItem, QuadrantKey } from './coaching-types'

const QUAD_TO_KEY: Record<'S' | 'W' | 'O' | 'T', QuadrantKey> = {
  S: 'strengths',
  W: 'weaknesses',
  O: 'opportunities',
  T: 'threats',
}

function scoreToConfidence(score: number | null | undefined): 'high' | 'medium' | 'low' {
  if (score == null || score >= 4) return 'high'
  if (score === 3) return 'medium'
  return 'low'
}

/**
 * Try to recover a SWOT coaching draft from DB.
 *
 * Source of truth after P2 merge: `swot_factors` rows with
 *   source_framework='ai_coaching'
 *   swot_analysis_id = current session anchor
 *
 * Legacy fallback: `swot_analyses` rows with quadrant='draft'
 * — only for users who haven't run manual-scripts/014_migrate_coaching_drafts_to_factors.sql yet.
 * TODO: remove legacy fallback after 1 deploy cycle + data migration confirmed.
 */
export async function fetchRecoveredDraft(
  orgId: string,
  analysisId: string
): Promise<SwotDraft | null> {
  try {
    const supabase = createClient()

    // Primary path: read from swot_factors
    const { data: factors } = await supabase
      .from('swot_factors')
      .select('id, quadrant, content, evidence_text, quality_score')
      .eq('swot_analysis_id', analysisId)
      .eq('source_framework', 'ai_coaching')
      .order('code', { ascending: true })

    if (factors && factors.length > 0) {
      const draft: SwotDraft = {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
        generatedAt: new Date().toISOString(),
        frameworksUsed: [],
      }
      for (const row of factors) {
        const qKey = QUAD_TO_KEY[row.quadrant as 'S' | 'W' | 'O' | 'T']
        if (!qKey) continue
        const item: SwotDraftItem = {
          id: row.id,
          statement: row.content,
          rationale: row.evidence_text ?? '',
          frameworkSource: '8Ms',
          confidence: scoreToConfidence(row.quality_score),
          isUserAdded: false,
        }
        ;(draft[qKey] as SwotDraftItem[]).push(item)
      }
      const total =
        draft.strengths.length +
        draft.weaknesses.length +
        draft.opportunities.length +
        draft.threats.length
      if (total > 0) return draft
    }

    // Legacy fallback: pre-migration swot_analyses.quadrant='draft' rows
    const { data: legacyRows } = await supabase
      .from('swot_analyses')
      .select('statement, evidence_json')
      .eq('org_id', orgId)
      .eq('quadrant', 'draft')

    if (!legacyRows?.length) return null

    const draft: SwotDraft = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      generatedAt: new Date().toISOString(),
      frameworksUsed: [],
    }

    for (const row of legacyRows) {
      const ej = row.evidence_json as Record<string, unknown> | null
      const quadrant = (ej?.quadrant as string) ?? 'strengths'
      const item: SwotDraftItem = {
        id: crypto.randomUUID(),
        statement: row.statement ?? '',
        rationale: (ej?.rationale as string) ?? '',
        frameworkSource: '8Ms',
        confidence: (ej?.confidence as 'high' | 'medium' | 'low') ?? 'medium',
        isUserAdded: (ej?.isUserAdded as boolean) ?? false,
      }
      if (quadrant in draft) {
        ;(draft[quadrant as QuadrantKey] as SwotDraftItem[]).push(item)
      }
    }

    const total =
      draft.strengths.length +
      draft.weaknesses.length +
      draft.opportunities.length +
      draft.threats.length

    return total > 0 ? draft : null
  } catch (err) {
    console.error('[fetchRecoveredDraft] error:', err)
    return null
  }
}

/**
 * Call /api/swot/synthesis with a 58s abort timeout.
 * Throws if the fetch fails or the API returns non-OK.
 */
export async function callSynthesisAPI(
  orgId: string,
  draft: SwotDraft,
  contextCards: ContextCard[]
): Promise<SwotSynthesisOutput> {
  const coachingItems = draftToCoachingItems(draft)
  const evidenceItems = contextCardsToEvidence(contextCards)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 58000)

  try {
    const response = await fetch('/api/swot/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        coaching_items: coachingItems,
        evidence_items: evidenceItems,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || 'Synthesis failed')
    }

    const data: SynthesisResult = await response.json()
    return synthesisResultToOutput(data)
  } finally {
    clearTimeout(timeoutId)
  }
}

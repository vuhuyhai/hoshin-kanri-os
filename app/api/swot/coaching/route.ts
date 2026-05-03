import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import { classifyAIError } from '@/lib/ai/classify-error'
import {
  getSwCoachingSystemPrompt,
  getOtCoachingSystemPrompt,
  buildConversationMemory,
  parseCoachingAIOutput,
} from '@/lib/swot/coaching-prompts'
import { COACHING_QUESTION_BANK } from '@/lib/swot/frameworks'
import { AI_MODELS } from '@/lib/ai/models'
import { trackerToCoachingContext } from '@/lib/swot/coaching-tracker'
import type {
  CoachingResponse,
  CoachingTrackerState,
  CoachingContext,
} from '@/lib/swot/types'
import { parseBody, swotCoachingSchema } from '@/lib/validation'
import { requireAiRateLimit } from '@/lib/ai/rate-limit-helper'

/**
 * SWOT Coaching - Akao Method (M-AICoach-Sensei-1)
 *
 * PHILOSOPHY:
 * - User chọn entry point (S/W/O/T), AI follow user
 * - KHÔNG enforce linear SW→OT (Hoshin Kanri Forest Ch.4)
 * - shouldTransition là HINT, không phải command
 * - Catchball: AI là sensei challenger, không phải decision maker
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = await requireAiRateLimit(user.id, { bucket: 'swot', limit: 50 })
    if (!rl.ok) return rl.response

    const bodyParsed = await parseBody(request, swotCoachingSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const body = bodyParsed.data
    const messages = body.messages
    const orgContext = body.orgContext
    const coachingTracker = body.coachingTracker as
      | CoachingTrackerState
      | undefined

    // TRUST client's currentFramework. Default 'sw' for backward-compat
    // clients that omit the field. Tracker no longer overrides — the client
    // owns SW vs OT routing under the Akao method.
    const currentFramework = body.currentFramework ?? 'sw'

    // Derive coaching context from tracker (if provided), for prompt injection
    const coachingContext = coachingTracker
      ? trackerToCoachingContext(coachingTracker)
      : (body.coachingContext as CoachingContext | undefined)

    const selectedDims = coachingTracker?.selectedDimensions
    const extChoice = coachingTracker?.selectedExternalFramework

    const basePrompt =
      currentFramework === 'sw'
        ? getSwCoachingSystemPrompt(orgContext, coachingContext, selectedDims?.['8M'])
        : getOtCoachingSystemPrompt(orgContext, coachingContext, extChoice, selectedDims?.Porter, selectedDims?.PESTEL)

    // Shallow-answer follow-up: if last user message is < 20 words,
    // append follow_up_prompt from the matching question
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    let followUpHint = ''
    if (lastUserMsg && lastUserMsg.content.split(/\s+/).length < 20 && coachingTracker) {
      const currentDim = coachingTracker.currentDimension
      const matchingQ = COACHING_QUESTION_BANK.find(
        (q) => q.dimension_key === currentDim && q.follow_up_prompt
      )
      if (matchingQ?.follow_up_prompt) {
        followUpHint = `\n\n[GOI Y HOI THEM vi CEO tra loi qua ngan]: ${matchingQ.follow_up_prompt}`
      }
    }

    // Conversation memory — trim old messages, summarize into prompt
    const { contextSummary, recentMessages } =
      buildConversationMemory(messages)
    const systemPrompt = basePrompt
      + (contextSummary ?? '')
      + followUpHint

    const client = createAnthropicClient()

    const response = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 4096,
      system: systemPrompt,
      messages: recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Parse structured JSON output with text fallback
    const aiOutput = parseCoachingAIOutput(rawText)

    // Markers parsed for backward compat — flag emitted in response, but
    // server does NOT auto-switch frameworks. Client decides next step.
    const isSwComplete =
      currentFramework === 'sw' && aiOutput.message.includes('[SW_COMPLETE]')
    const isOtComplete =
      currentFramework === 'ot' && aiOutput.message.includes('[OT_COMPLETE]')
    const isCoachingComplete = isSwComplete || isOtComplete

    // Clean markers from display message
    const cleanMessage = aiOutput.message
      .replace('[SW_COMPLETE]', '')
      .replace('[OT_COMPLETE]', '')
      .trim()

    // Compute updated coaching tracker — append-only, no flow forcing
    let updatedCoachingTracker: CoachingTrackerState | undefined
    if (coachingTracker) {
      updatedCoachingTracker = computeUpdatedTracker(coachingTracker, aiOutput)
    }

    const result: CoachingResponse = {
      message: { role: 'assistant', content: cleanMessage },
      isCoachingComplete,
      extractedInsight: aiOutput.extractedInsight,
      shouldTransition: aiOutput.shouldTransition,
      nextDimension: aiOutput.nextDimension,
      updatedCoachingTracker,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[coaching] error:', error)
    const classified = classifyAIError(error, 'AI coach')
    return NextResponse.json(classified, { status: classified.status })
  }
}

// ============================================================
// State computation — append-only tracker update
// ============================================================
// Akao Method: server records insights but does NOT force framework
// transitions or dimension walks. Client decides whether to act on
// shouldTransition / [SW_COMPLETE] / [OT_COMPLETE].

function computeUpdatedTracker(
  tracker: CoachingTrackerState,
  parsed: ReturnType<typeof parseCoachingAIOutput>,
): CoachingTrackerState {
  const updated: CoachingTrackerState = {
    ...tracker,
    messageCount: tracker.messageCount + 2, // user + assistant
    lastUpdated: new Date().toISOString(),
  }

  if (parsed.extractedInsight) {
    const fw = parsed.extractedInsight.framework
    updated.insights = {
      ...updated.insights,
      [fw]: [
        ...updated.insights[fw],
        {
          dimension: parsed.extractedInsight.dimension,
          insight: parsed.extractedInsight.insight,
          confidence: parsed.extractedInsight.confidence,
          collectedAt: new Date().toISOString(),
        },
      ],
    }
  }

  return updated
}

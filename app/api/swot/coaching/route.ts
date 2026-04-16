import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import {
  getSwCoachingSystemPrompt,
  getOtCoachingSystemPrompt,
  buildConversationMemory,
  parseCoachingAIOutput,
} from '@/lib/swot/coaching-prompts'
import { COACHING_QUESTION_BANK } from '@/lib/swot/frameworks'
import { AI_MODELS } from '@/lib/ai/models'
import {
  getNextDimension,
  getNextFramework,
  getFirstDimension,
  frameworkIdToLegacy,
  trackerToCoachingContext,
} from '@/lib/swot/coaching-tracker'
import type {
  CoachingResponse,
  CoachingTrackerState,
  CoachingContext,
} from '@/lib/swot/types'
import { parseBody, swotCoachingSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bodyParsed = await parseBody(request, swotCoachingSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const body = bodyParsed.data
    const messages = body.messages
    const orgContext = body.orgContext
    const currentFramework = body.currentFramework
    const coachingTracker = body.coachingTracker as
      | CoachingTrackerState
      | undefined

    // Derive coaching context from tracker (if provided), for prompt injection
    const coachingContext = coachingTracker
      ? trackerToCoachingContext(coachingTracker)
      : (body.coachingContext as CoachingContext | undefined)

    // Use tracker's framework if available, otherwise use request field
    const effectiveFramework = coachingTracker
      ? frameworkIdToLegacy(coachingTracker.currentFramework)
      : currentFramework

    // Build system prompt with coaching context + dimension selection
    const selectedDims = coachingTracker?.selectedDimensions
    const extChoice = coachingTracker?.selectedExternalFramework

    const basePrompt =
      effectiveFramework === 'sw'
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
      max_tokens: 800,
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

    // Check completion markers
    const isSwComplete =
      effectiveFramework === 'sw' && aiOutput.message.includes('[SW_COMPLETE]')
    const isOtComplete =
      effectiveFramework === 'ot' && aiOutput.message.includes('[OT_COMPLETE]')
    const isCoachingComplete = isSwComplete || isOtComplete

    // Clean markers from display message
    const cleanMessage = aiOutput.message
      .replace('[SW_COMPLETE]', '')
      .replace('[OT_COMPLETE]', '')
      .trim()

    // Compute updated coaching tracker state
    let updatedCoachingTracker: CoachingTrackerState | undefined
    if (coachingTracker) {
      updatedCoachingTracker = computeUpdatedTracker(
        coachingTracker,
        aiOutput,
        isSwComplete,
        isOtComplete
      )
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
    console.error('Coaching API error:', error)
    return NextResponse.json(
      { error: 'Khong the ket noi AI coach. Thu lai.' },
      { status: 500 }
    )
  }
}

// ============================================================
// State computation — server-side tracker update
// ============================================================

function computeUpdatedTracker(
  tracker: CoachingTrackerState,
  parsed: ReturnType<typeof parseCoachingAIOutput>,
  isSwComplete: boolean,
  isOtComplete: boolean
): CoachingTrackerState {
  const updated: CoachingTrackerState = {
    ...tracker,
    messageCount: tracker.messageCount + 2, // user + assistant
    lastUpdated: new Date().toISOString(),
  }

  // Append extracted insight
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
    updated.currentPhase = 'questioning'
  }

  // Dimension transition (only when AI explicitly signals)
  if (parsed.shouldTransition) {
    const fw = updated.currentFramework
    if (!updated.completedDimensions[fw].includes(updated.currentDimension)) {
      updated.completedDimensions = {
        ...updated.completedDimensions,
        [fw]: [...updated.completedDimensions[fw], updated.currentDimension],
      }
    }

    // Compute next dimension from framework sequence (authoritative)
    const nextDim = getNextDimension(fw, updated.currentDimension)
    if (nextDim) {
      updated.currentDimension = nextDim
      updated.currentPhase = 'transitioning'
    }
  }

  // Framework completion
  if (isSwComplete) {
    if (!updated.completedFrameworks.includes('8M')) {
      updated.completedFrameworks = [...updated.completedFrameworks, '8M']
    }
    const nextFw = getNextFramework('8M')
    if (nextFw) {
      updated.currentFramework = nextFw
      updated.currentDimension = getFirstDimension(nextFw)
      updated.currentPhase = 'intro'
    }
  }

  if (isOtComplete) {
    // OT covers both Porter and PESTEL
    for (const fw of ['Porter', 'PESTEL'] as const) {
      if (!updated.completedFrameworks.includes(fw)) {
        updated.completedFrameworks = [...updated.completedFrameworks, fw]
      }
    }
    updated.currentPhase = 'completed'
  }

  return updated
}

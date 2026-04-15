import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVisionDraftPrompt } from '@/lib/discovery/prompts'
import type {
  VisionDraft,
  VisionDraftResponse,
} from '@/lib/discovery/types'
import { AI_MODELS } from '@/lib/ai/models'
import { streamClaudeJson } from '@/lib/ai/stream-json'
import { parseBody, visionDraftSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await parseBody(request, visionDraftSchema)
  if (!body.ok) return body.response
  const { answers, orgContext } = body.data

  const prompt = getVisionDraftPrompt(answers, orgContext)

  return streamClaudeJson<VisionDraft, VisionDraftResponse>({
    tag: 'vision-draft',
    model: AI_MODELS.reasoning,
    maxTokens: 800,
    prompt,
    parse: (text) => JSON.parse(text) as VisionDraft,
    finalize: (parsed) => ({ draft: parsed }),
  })
}

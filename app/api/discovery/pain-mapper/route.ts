import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { getPainMapperPrompt } from '@/lib/discovery/prompts'
import type {
  HoshinCandidate,
  PainMapperResponse,
} from '@/lib/discovery/types'
import { toJson } from '@/lib/utils'
import { AI_MODELS } from '@/lib/ai/models'
import { streamClaudeJson } from '@/lib/ai/stream-json'
import { parseBody, painMapperSchema } from '@/lib/validation'
import { requireRateLimit } from '@/lib/http/rate-limit-helper'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await requireRateLimit(user.id, {
    bucket: 'ai:discovery',
    limit: 50,
    message: 'Bạn đang gọi AI quá nhanh. Vui lòng đợi vài phút rồi thử lại.',
  })
  if (!rl.ok) return rl.response

  const body = await parseBody(request, painMapperSchema)
  if (!body.ok) return body.response
  const { painPoints, orgContext } = body.data

  const prompt = getPainMapperPrompt(painPoints, orgContext)

  return streamClaudeJson<
    { candidates: HoshinCandidate[] },
    PainMapperResponse
  >({
    tag: 'pain-mapper',
    model: AI_MODELS.reasoning,
    maxTokens: 1500,
    prompt,
    parse: (text) =>
      JSON.parse(text) as { candidates: HoshinCandidate[] },
    finalize: async (parsed) => {
      const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
      const membership = await getActiveMembership(supabase, user.id, lastOrgId)

      if (membership) {
        // Delete existing to avoid duplicates on re-run
        await supabase
          .from('discovery_sessions')
          .delete()
          .eq('org_id', membership.org_id)
          .eq('step_completed', 'pain_mapper')

        await supabase.from('discovery_sessions').insert({
          org_id: membership.org_id,
          user_id: user.id,
          step_completed: 'pain_mapper',
          data_json: toJson({
            painPoints,
            candidates: parsed.candidates,
          }),
        })
      }

      return { candidates: parsed.candidates }
    },
  })
}

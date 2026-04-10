import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import type { CoachingTrackerState, ChatMessage } from './types'

type DbClient = SupabaseClient<Database>

interface CoachingSessionPayload {
  coachingState: CoachingTrackerState
  messages: ChatMessage[]
  savedAt: string
}

// ============================================================
// SAVE — upsert coaching data into discovery_sessions.data_json
// ============================================================

export async function saveCoachingSession(
  supabase: DbClient,
  orgId: string,
  userId: string,
  payload: CoachingSessionPayload
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('discovery_sessions')
      .select('id, data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'swot')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const coachingChat = {
      coachingState: payload.coachingState,
      messages: payload.messages,
      savedAt: payload.savedAt,
    }

    if (existing) {
      const existingData = (existing.data_json ?? {}) as Record<
        string,
        unknown
      >
      await supabase
        .from('discovery_sessions')
        .update({
          data_json: {
            ...existingData,
            coachingChat,
          } as unknown as Json,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('discovery_sessions').insert({
        org_id: orgId,
        user_id: userId,
        step_completed: 'swot',
        data_json: { coachingChat } as unknown as Json,
      })
    }
  } catch (err) {
    // Don't throw — don't block UX
    console.error('[coaching-persistence] save error:', err)
  }
}

// ============================================================
// LOAD — extract coaching data from discovery_sessions.data_json
// ============================================================

export async function loadCoachingSession(
  supabase: DbClient,
  orgId: string
): Promise<CoachingSessionPayload | null> {
  try {
    const { data } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'swot')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data?.data_json) return null

    const json = data.data_json as Record<string, unknown>
    const chat = json.coachingChat as
      | {
          coachingState?: CoachingTrackerState
          messages?: ChatMessage[]
          savedAt?: string
        }
      | undefined

    if (!chat?.coachingState || !chat?.messages || chat.messages.length === 0) {
      return null
    }

    return {
      coachingState: chat.coachingState,
      messages: chat.messages,
      savedAt: chat.savedAt ?? new Date().toISOString(),
    }
  } catch (err) {
    console.error('[coaching-persistence] load error:', err)
    return null
  }
}

// ============================================================
// DELETE — remove coaching data from data_json (keeps record)
// ============================================================

export async function deleteCoachingSession(
  supabase: DbClient,
  orgId: string
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('discovery_sessions')
      .select('id, data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'swot')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!existing) return

    const existingData = (existing.data_json ?? {}) as Record<
      string,
      unknown
    >

    // Remove coachingChat key, preserve other data
    const cleaned = Object.fromEntries(
      Object.entries(existingData).filter(([key]) => key !== 'coachingChat')
    )

    await supabase
      .from('discovery_sessions')
      .update({ data_json: cleaned as unknown as Json })
      .eq('id', existing.id)
  } catch (err) {
    console.error('[coaching-persistence] delete error:', err)
  }
}

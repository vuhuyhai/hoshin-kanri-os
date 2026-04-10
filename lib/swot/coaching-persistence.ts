/**
 * @deprecated Logic moved to lib/swot/swot-session-store.ts
 * Safe to delete after verifying no remaining imports.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/supabase/types'
import type {
  CoachingTrackerState,
  ChatMessage,
  DiscoverySessionCoaching,
} from './types'

type DbClient = SupabaseClient<Database>

const STEP_KEY = 'swot_coaching' as const

// ============================================================
// SAVE — upsert coaching data into discovery_sessions
// ============================================================

export async function saveCoachingSession(
  supabase: DbClient,
  orgId: string,
  userId: string,
  payload: {
    coachingState: CoachingTrackerState
    messages: ChatMessage[]
    savedAt: string
  }
): Promise<void> {
  try {
    const dataJson: DiscoverySessionCoaching = {
      step: STEP_KEY,
      coachingState: payload.coachingState,
      messages: payload.messages,
      completedAt:
        payload.coachingState.currentPhase === 'completed'
          ? payload.savedAt
          : null,
      savedAt: payload.savedAt,
    }

    // Delete existing, then insert (safe upsert)
    await supabase
      .from('discovery_sessions')
      .delete()
      .eq('org_id', orgId)
      .eq('step_completed', STEP_KEY)

    await supabase.from('discovery_sessions').insert({
      org_id: orgId,
      user_id: userId,
      step_completed: STEP_KEY,
      data_json: dataJson as unknown as Json,
    })
  } catch (err) {
    // Don't throw — don't block UX
    console.error('[coaching-persistence] save error:', err)
  }
}

// ============================================================
// LOAD — extract coaching data from discovery_sessions
// ============================================================

export async function loadCoachingSession(
  supabase: DbClient,
  orgId: string
): Promise<{
  coachingState: CoachingTrackerState
  messages: ChatMessage[]
  savedAt: string
} | null> {
  try {
    const { data } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', STEP_KEY)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data?.data_json) return null

    const json = data.data_json as unknown as DiscoverySessionCoaching

    if (!json.coachingState || !json.messages || json.messages.length === 0) {
      return null
    }

    return {
      coachingState: json.coachingState,
      messages: json.messages,
      savedAt: json.savedAt ?? new Date().toISOString(),
    }
  } catch (err) {
    console.error('[coaching-persistence] load error:', err)
    return null
  }
}

// ============================================================
// DELETE — remove coaching session record
// ============================================================

export async function deleteCoachingSession(
  supabase: DbClient,
  orgId: string
): Promise<void> {
  try {
    await supabase
      .from('discovery_sessions')
      .delete()
      .eq('org_id', orgId)
      .eq('step_completed', STEP_KEY)
  } catch (err) {
    console.error('[coaching-persistence] delete error:', err)
  }
}

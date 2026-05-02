import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Get the active org membership for a user.
 * Handles multi-org: prefer lastOrgId from user metadata, fallback to newest member row.
 * Returns null if user has no org.
 *
 * Caller must pass lastOrgId from user.user_metadata?.last_org_id to avoid
 * a second auth.getUser() round-trip inside this helper.
 */
export async function getActiveMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  lastOrgId: string | null,
): Promise<{ org_id: string; role: string } | null> {
  const { data } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!data || data.length === 0) return null

  return data.find((m) => m.org_id === lastOrgId) ?? data[0]
}
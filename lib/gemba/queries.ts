import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type {
  GembaCommentWithAuthor,
  GembaUnreadSummary,
  GembaTargetType,
} from './types'

type DbClient = SupabaseClient<Database>

/**
 * List comments cho 1 target (Hoshin hoặc KPI), enriched với
 * author display name từ profiles.
 *
 * 2 round-trips (comments + profiles.in()) — Supabase RLS không
 * cho join auth.users qua FK trực tiếp, profiles là next-best
 * source. author_email luôn '' ở Task 5 (defer M-Hoshin-6 nếu
 * UI cần email thật).
 *
 * Order created_at DESC: newest first cho thread reading.
 */
export async function listGembaCommentsByTarget(
  supabase: DbClient,
  orgId: string,
  targetType: GembaTargetType,
  targetId: string,
): Promise<GembaCommentWithAuthor[]> {
  const { data: comments, error } = await supabase
    .from('gemba_comments')
    .select('*')
    .eq('org_id', orgId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listGembaCommentsByTarget: ${error.message}`)
  if (!comments || comments.length === 0) return []

  const userIds = Array.from(
    new Set(
      comments.flatMap(
        (c) =>
          [c.created_by, c.acknowledged_by, c.resolved_by].filter(
            Boolean,
          ) as string[],
      ),
    ),
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map<string, string | null>(
    profiles?.map((p) => [p.id, p.full_name]) ?? [],
  )

  return comments.map((c) => ({
    ...c,
    author_name: profileMap.get(c.created_by) ?? null,
    author_email: '',
    acknowledged_by_name: c.acknowledged_by
      ? profileMap.get(c.acknowledged_by) ?? null
      : null,
    resolved_by_name: c.resolved_by
      ? profileMap.get(c.resolved_by) ?? null
      : null,
  }))
}

/**
 * Banner CEO POV: count comments status='open' grouped by target.
 * 1 query + group ở app layer (volume thấp — org < 100 open
 * comments là realistic upper bound). Sort DESC theo count để
 * banner show target hot nhất đầu.
 */
export async function getGembaUnreadSummary(
  supabase: DbClient,
  orgId: string,
): Promise<GembaUnreadSummary> {
  const { data, error } = await supabase
    .from('gemba_comments')
    .select('target_type, target_id')
    .eq('org_id', orgId)
    .eq('status', 'open')

  if (error) throw new Error(`getGembaUnreadSummary: ${error.message}`)

  if (!data || data.length === 0) {
    return { total_open: 0, by_target: [] }
  }

  const groupMap = new Map<
    string,
    { target_type: GembaTargetType; target_id: string; count: number }
  >()

  for (const row of data) {
    const key = `${row.target_type}:${row.target_id}`
    const existing = groupMap.get(key)
    if (existing) {
      existing.count++
    } else {
      groupMap.set(key, {
        target_type: row.target_type,
        target_id: row.target_id,
        count: 1,
      })
    }
  }

  return {
    total_open: data.length,
    by_target: Array.from(groupMap.values()).sort((a, b) => b.count - a.count),
  }
}

/**
 * Member self-view: "Lịch sử góp ý của tôi". Exposed cho Task 6
 * API list endpoint nếu route hỗ trợ ?author=me. author_name=null
 * vì caller là chính user — không cần lookup.
 */
export async function listGembaCommentsByAuthor(
  supabase: DbClient,
  orgId: string,
  userId: string,
): Promise<GembaCommentWithAuthor[]> {
  const { data: comments, error } = await supabase
    .from('gemba_comments')
    .select('*')
    .eq('org_id', orgId)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`listGembaCommentsByAuthor: ${error.message}`)

  return (comments ?? []).map((c) => ({
    ...c,
    author_name: null,
    author_email: '',
  }))
}

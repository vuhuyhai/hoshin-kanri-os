import { createAdminClient } from '@/lib/supabase/admin'

export type SubscribeResult =
  | { status: 'created' }
  | { status: 'already' }
  | { status: 'reactivated' }

/**
 * Insert or reactivate a subscriber. Email comparison is done
 * case-insensitively via the lower(email) unique index from
 * migration 026. If the address was previously unsubscribed we
 * clear the `unsubscribed_at` timestamp instead of inserting a
 * duplicate.
 */
export async function addSubscriber(params: {
  email: string
  source: string
}): Promise<SubscribeResult> {
  const db = createAdminClient()
  const normalized = params.email.trim().toLowerCase()

  const { data: existing, error: lookupErr } = await db
    .from('newsletter_subscribers')
    .select('id, unsubscribed_at')
    .eq('email', normalized)
    .maybeSingle()
  if (lookupErr) throw lookupErr

  if (existing) {
    if (existing.unsubscribed_at) {
      const { error: updErr } = await db
        .from('newsletter_subscribers')
        .update({ unsubscribed_at: null, source: params.source })
        .eq('id', existing.id)
      if (updErr) throw updErr
      return { status: 'reactivated' }
    }
    return { status: 'already' }
  }

  const { error: insErr } = await db
    .from('newsletter_subscribers')
    .insert({ email: normalized, source: params.source })
  if (insErr) throw insErr
  return { status: 'created' }
}

import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — cookies may not be writable
          }
        },
      },
    }
  )
}

/**
 * Verify that a user belongs to the given org.
 * Returns true if membership exists, false otherwise.
 */
export async function verifyOrgMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()
  return !!data
}

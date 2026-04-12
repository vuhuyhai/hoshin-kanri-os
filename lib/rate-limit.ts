import { createAdminClient } from '@/lib/supabase/admin'

export type RateLimitResult = {
  allowed: boolean
  count: number
  limit: number
  resetAt: Date
}

export async function checkRateLimit(params: {
  key: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = params
  const windowMs = windowSeconds * 1000
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)
  const resetAt = new Date(windowStartMs + windowMs)

  const supabase = createAdminClient()
  const { data: count, error } = await supabase.rpc('increment_rate_limit', {
    p_bucket: key,
    p_window_start: windowStart.toISOString(),
  })

  // Fail open: infra issues should not block legitimate lead capture.
  // Attacker has no way to trigger the failure path deterministically.
  if (error || typeof count !== 'number') {
    console.error('Rate limit check failed:', error)
    return { allowed: true, count: 0, limit, resetAt }
  }

  return { allowed: count <= limit, count, limit, resetAt }
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

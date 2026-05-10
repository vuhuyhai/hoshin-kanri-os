import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

export type RateLimitOptions = {
  bucket: string
  limit?: number
  windowSeconds?: number
  message?: string
  extras?: Record<string, unknown>
}

const DEFAULT_LIMIT = 50
const DEFAULT_WINDOW_SECONDS = 300
const DEFAULT_MESSAGE = 'Quá nhiều request'

export async function requireRateLimit(
  userId: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const {
    bucket,
    limit = DEFAULT_LIMIT,
    windowSeconds = DEFAULT_WINDOW_SECONDS,
    message = DEFAULT_MESSAGE,
    extras,
  } = options

  const rl = await checkRateLimit({
    key: `${bucket}:${userId}`,
    limit,
    windowSeconds,
  })

  if (!rl.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
    )
    return {
      ok: false,
      response: NextResponse.json(
        { error: message, retryAfter, ...extras },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      ),
    }
  }

  return { ok: true }
}

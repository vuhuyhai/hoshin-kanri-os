import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export type AiRateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

export type AiRateLimitOptions = {
  limit?: number
  windowSeconds?: number
  bucket?: string
}

const DEFAULT_LIMIT = 50
const DEFAULT_WINDOW_SECONDS = 300
const DEFAULT_BUCKET = 'ai-default'

export async function requireAiRateLimit(
  userId: string,
  options: AiRateLimitOptions = {},
): Promise<AiRateLimitResult> {
  const limit = options.limit ?? DEFAULT_LIMIT
  const windowSeconds = options.windowSeconds ?? DEFAULT_WINDOW_SECONDS
  const bucket = options.bucket ?? DEFAULT_BUCKET

  const result = await checkRateLimit({
    key: `ai:${bucket}:${userId}`,
    limit,
    windowSeconds,
  })

  if (result.allowed) return { ok: true }

  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
  )

  const response = NextResponse.json(
    {
      error: 'Bạn đang gọi AI quá nhanh. Vui lòng đợi vài phút rồi thử lại.',
      retryAfter,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    },
  )

  return { ok: false, response }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ZodType } from 'zod'

export * from './schemas'

// Basic email validation shared between client forms and server routes.
// Not RFC-complete — catches obvious typos without rejecting real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

/**
 * Parse and validate a JSON request body against a Zod schema.
 *
 * Usage in a route handler:
 *
 *   const parsed = await parseBody(request, registerSchema)
 *   if (!parsed.ok) return parsed.response
 *   const { email, password } = parsed.data
 *
 * On failure returns a ready-to-return 400 NextResponse with the first
 * issue's message as `error` and the full issues array for debugging.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<ParseResult<T>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Dữ liệu gửi lên không hợp lệ (JSON không parse được)' },
        { status: 400 },
      ),
    }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    const message = firstIssue?.message ?? 'Dữ liệu không hợp lệ'
    return {
      ok: false,
      response: NextResponse.json(
        { error: message, issues: result.error.issues },
        { status: 400 },
      ),
    }
  }
  return { ok: true, data: result.data }
}

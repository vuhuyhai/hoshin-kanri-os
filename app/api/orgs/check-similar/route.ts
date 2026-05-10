import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBody } from '@/lib/validation'
import { requireRateLimit } from '@/lib/http/rate-limit-helper'

const RATE_LIMIT = 10
const RATE_WINDOW_SECONDS = 60
const MATCH_LIMIT = 5
const NAME_QUERY_LOG_MAX = 50

const checkSimilarSchema = z.object({
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(1).max(100),
})

type SimilarMatch = { name: string; city: string; industry: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseBody(request, checkSimilarSchema)
    if (!parsed.ok) return parsed.response
    const { name, city } = parsed.data

    const rl = await requireRateLimit(user.id, {
      bucket: 'orgs:check-similar',
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
    })
    if (!rl.ok) return rl.response

    const admin = createAdminClient()
    const nameLower = name.toLowerCase()
    const cityLower = city.toLowerCase()

    // ilike with no wildcards = case-insensitive exact match. Bypasses RLS
    // via service role since user has no org_member row yet (pre-onboarding).
    const { data: rows, error: queryError } = await admin
      .from('organizations')
      .select('name, city, industry')
      .ilike('name', nameLower)
      .ilike('city', cityLower)
      .limit(MATCH_LIMIT)

    if (queryError) {
      console.error('check-similar query error:', {
        userId: user.id,
        code: queryError.code,
      })
      return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
    }

    const matches: SimilarMatch[] = rows ?? []

    // Audit log — silent fail, never blocks response. No audit_logs table
    // exists yet (verified absent from migrations + Database types), so log
    // structured JSON to Vercel runtime logs. Migrate to a table later if
    // volume warrants.
    try {
      console.log(
        '[audit:check-similar]',
        JSON.stringify({
          user_id: user.id,
          name_query: nameLower.slice(0, NAME_QUERY_LOG_MAX),
          city_query: cityLower,
          match_count: matches.length,
          timestamp: new Date().toISOString(),
        }),
      )
    } catch (auditError) {
      console.error('check-similar audit log failed:', auditError)
    }

    return NextResponse.json({
      hasMatches: matches.length > 0,
      matches,
    })
  } catch (error) {
    console.error('check-similar handler error:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

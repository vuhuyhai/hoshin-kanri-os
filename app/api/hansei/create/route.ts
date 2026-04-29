import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import { parseBody } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { createHanseiSchema } from '@/lib/hansei/schema'
import { getRedStreaks } from '@/lib/hansei/queries'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 },
      )
    }

    const bodyParsed = await parseBody(request, createHanseiSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { kpi_id, week_start, streak_weeks, why_red, next_action } =
      bodyParsed.data

    const { data: kpi, error: kpiError } = await supabase
      .from('kpis')
      .select('id, org_id')
      .eq('id', kpi_id)
      .maybeSingle()

    if (kpiError) {
      console.error(`[/api/hansei/create] [${requestId}]`, kpiError)
      return NextResponse.json(
        { error: 'Không thể tải KPI', requestId },
        { status: 500 },
      )
    }
    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI không tồn tại', requestId },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      kpi.org_id,
      WRITE_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const rate = await checkRateLimit({
      key: `hansei:create:${user.id}`,
      limit: 30,
      windowSeconds: 300,
    })
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: 'Bạn đang lưu hansei quá nhanh. Vui lòng đợi vài phút.',
          retryAfter,
          requestId,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      )
    }

    // Anti-fake: client cannot just claim arbitrary streak_weeks. Server
    // recomputes streaks from kpi_entries and we accept the request only
    // if the current detected streak is at least as long as the claim
    // (>= rather than == leaves room for the streak having extended
    // between dashboard load and submit click).
    const streaks = await getRedStreaks(supabase, kpi.org_id)
    const matchedStreak = streaks.find((s) => s.kpi_id === kpi_id)
    if (!matchedStreak || matchedStreak.streak_weeks < streak_weeks) {
      return NextResponse.json(
        {
          error: 'KPI không có streak red đủ điều kiện hansei',
          requestId,
        },
        { status: 400 },
      )
    }

    const { data: row, error: upsertError } = await supabase
      .from('weekly_hansei')
      .upsert(
        {
          org_id: kpi.org_id,
          kpi_id,
          week_start,
          streak_weeks,
          why_red,
          next_action,
          created_by: user.id,
        },
        { onConflict: 'kpi_id,week_start' },
      )
      .select('*')
      .single()

    if (upsertError || !row) {
      console.error(`[/api/hansei/create] [${requestId}]`, upsertError)
      return NextResponse.json(
        { error: 'Không thể lưu hansei', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, hansei: row })
  } catch (err) {
    console.error(`[/api/hansei/create] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Không thể lưu hansei', requestId },
      { status: 500 },
    )
  }
}

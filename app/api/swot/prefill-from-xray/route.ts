import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { XRayResult } from '@/lib/x-ray/types'

const FRAMEWORK_SCORE_THRESHOLD = 70

interface XRayRow {
  id: string
  overall_score: number
  result_json: XRayResult
  created_at: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    if (!membership) return NextResponse.json({ prefilled: false })

    const orgId = membership.org_id

    // TODO: chạy `supabase gen types` sau khi confirm xray_results schema ổn định
    // @ts-ignore — xray_results (migration 005) chưa có trong generated types
    let query = supabase.from('xray_results').select('id, overall_score, result_json, created_at').eq('org_id', orgId)
    query = query.order('created_at', { ascending: false })
    const { data: xrayRows } = await query.limit(1)

    const xray = (xrayRows as unknown as XRayRow[] | null)?.[0]
    if (!xray) return NextResponse.json({ prefilled: false })

    const { data: org } = await supabase
      .from('organizations')
      .select('industry, headcount')
      .eq('id', orgId)
      .single()

    const pillars = [...(xray.result_json?.pillarScores ?? [])].sort((a, b) => a.score - b.score)

    if (!pillars.length) return NextResponse.json({ prefilled: false })

    // 2 lowest-scoring dimensions → challenges text
    const challenges = pillars
      .slice(0, 2)
      .map((p) => `Doanh nghiệp đang gặp khó khăn về ${p.label}: ${p.topIssue || p.summary}`)
      .join('. ')

    // Highest-scoring dimension → strengths text
    const top = pillars[pillars.length - 1]
    const strengths = `Điểm mạnh nổi bật: ${top.label} đạt ${top.score}/100`

    // Framework suggestion based on total score
    const totalScore = xray.overall_score
    const suggestedFrameworkOT: 'porter5' | 'PESTEL' =
      totalScore >= FRAMEWORK_SCORE_THRESHOLD ? 'porter5' : 'PESTEL'

    return NextResponse.json({
      prefilled: true,
      source: { date: xray.created_at, totalScore },
      data: {
        industry: org?.industry ?? '',
        headcount: org?.headcount ?? '',
        challenges,
        goals: '',
        strengths,
        suggestedFrameworkSW: '8Ms' as const,
        suggestedFrameworkOT,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Không thể tải dữ liệu prefill' },
      { status: 500 },
    )
  }
}

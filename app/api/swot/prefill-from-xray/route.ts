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

    // Find latest X-Ray attributable to this user. Match either by current
    // org_id OR by user_id — covers users who ran X-Ray before their
    // org_members row existed (anon → signup → x-ray → onboarding → swot).
    // xray_results.ownership_check (migration 019) guarantees at least one
    // of org_id/user_id is non-null, so this OR covers every owned row.
    const { data: xrayRows } = await supabase
      .from('xray_results')
      .select('id, overall_score, result_json, created_at')
      .or(`org_id.eq.${orgId},user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1)

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

    // 12-month breakthrough goal: anchor it in the X-Ray's first concrete
    // top-action and the score-band gap. Min length must clear the form's
    // 15-char validator (line 104 of SwotContextForm).
    const totalScore = xray.overall_score
    const topAction = xray.result_json?.topActions?.[0]?.trim() ?? ''
    const targetScore = totalScore < 50 ? Math.min(70, totalScore + 25)
      : totalScore < 70 ? 75
      : Math.min(95, totalScore + 10)
    // Guard against very-short topAction strings that would produce
    // a leading-period cosmetic artifact ("." + appended sentence).
    const goals = topAction.length > 3
      ? `${topAction}. Đồng thời nâng tổng điểm OPEX từ ${totalScore}/100 lên ≥${targetScore}/100 trong 12 tháng tới.`
      : `Nâng tổng điểm OPEX từ ${totalScore}/100 lên ≥${targetScore}/100 trong 12 tháng, ưu tiên cải thiện ${pillars[0].label}.`

    // Framework suggestion based on total score
    const suggestedFrameworkOT: 'porter5' | 'PESTEL' =
      totalScore >= FRAMEWORK_SCORE_THRESHOLD ? 'porter5' : 'PESTEL'

    // Industry: org settings first, then X-Ray companyInfo as fallback so
    // users who ran X-Ray before completing org setup still get a value.
    const industry = org?.industry || xray.result_json?.industry || ''

    return NextResponse.json({
      prefilled: true,
      source: { date: xray.created_at, totalScore },
      data: {
        industry,
        headcount: org?.headcount ?? '',
        challenges,
        goals,
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

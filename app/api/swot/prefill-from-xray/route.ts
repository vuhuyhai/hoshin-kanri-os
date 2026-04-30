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

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError?.code === 'PGRST116') {
      console.warn(`[swot-prefill-from-xray] Multi-org user ${user.id}`)
      return NextResponse.json(
        { error: 'User belongs to multiple organizations. Please specify org_id explicitly.' },
        { status: 409 },
      )
    }

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

    // Q: "3 thách thức lớn nhất hiện tại" — 3 lowest pillars as a numbered
    // list of concrete issues, one per line. topIssue is the per-pillar
    // "1 câu vấn đề cần ưu tiên giải quyết" the X-Ray AI already produced.
    const worst = pillars.slice(0, 3)
    const challenges = worst
      .map((p, i) => `${i + 1}. ${p.label} (${p.score}/100): ${p.topIssue || p.summary}`)
      .join('\n')

    // Q: "Điều doanh nghiệp đang làm TỐT NHẤT" — highest-scoring pillar
    // with the AI's per-pillar observation so it describes what the org
    // actually does well, not just a score label.
    const top = pillars[pillars.length - 1]
    const strengths = `${top.label} (${top.score}/100) — ${top.summary}`

    // Q: "Mục tiêu lớn nhất muốn đạt trong 12 tháng tới" — a forward-looking
    // breakthrough goal anchored in the X-Ray score gap + the pillars most
    // in need of improvement. Do NOT use topActions[0] here: those are
    // 30-day actions, not 12-month goals, and conflating them misreads the
    // question for the CEO filling this form.
    const totalScore = xray.overall_score
    const targetScore = totalScore < 50 ? Math.min(70, totalScore + 25)
      : totalScore < 70 ? 75
      : Math.min(95, totalScore + 10)
    const focusAreas = worst.slice(0, 2).map((p) => p.label).join(' và ')
    const goals = `Nâng tổng điểm OPEX từ ${totalScore}/100 lên ≥${targetScore}/100 trong 12 tháng tới, trọng tâm cải thiện ${focusAreas}.`

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

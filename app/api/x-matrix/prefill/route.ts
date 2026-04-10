import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { HoshinCandidate } from '@/lib/swot/types'

function inferUnit(name: string): string {
  const l = name.toLowerCase()
  if (/tỷ lệ|%|phần trăm|retention|churn|conversion/.test(l)) return '%'
  if (/doanh thu|revenue|vnd|triệu|tỷ/.test(l)) return 'VND'
  if (/ngày|giờ|thời gian/.test(l)) return 'ngày'
  if (/điểm|nps|score/.test(l)) return 'điểm'
  return 'số'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('org_members').select('org_id').eq('user_id', user.id).single()
    if (!membership) return NextResponse.json({ hasPrefill: false, data: null })

    const org_id = membership.org_id

    const [{ data: strategySession }, { data: visionSession }] = await Promise.all([
      supabase.from('discovery_sessions').select('data_json')
        .eq('org_id', org_id).eq('step_completed', 'swot_strategy').single(),
      supabase.from('discovery_sessions').select('data_json')
        .eq('org_id', org_id).eq('step_completed', 'vision').single(),
    ])

    if (!strategySession) {
      return NextResponse.json({ error: 'Cần hoàn thành Hoshin Strategy trước' }, { status: 400 })
    }

    const sessionData = strategySession.data_json as unknown as {
      hoshin_candidates: HoshinCandidate[]; ai_recommendation: string
    }
    const selected = sessionData.hoshin_candidates.filter((c) => c.selected)
    const visionData = visionSession?.data_json as unknown as {
      vision?: string; year_goals?: string[]
    } | null

    return NextResponse.json({
      vision: visionData?.vision ?? null,
      year_goals: visionData?.year_goals ?? [],
      hoshins: selected.map((c, idx) => ({
        id: `h${idx + 1}`,
        title: c.title,
        rationale: c.rationale,
        tows_type: c.type,
        timeframe: c.timeframe,
        score: c.score,
        kpis: [{
          id: `kpi${idx + 1}_1`,
          name: c.kpi_suggestion,
          unit: inferUnit(c.kpi_suggestion),
          target_value: null,
          frequency: 'monthly',
          owner_user_id: null,
        }],
        initiatives: [],
      })),
      source: 'swot_discovery',
      generated_at: new Date().toISOString(),
      ai_recommendation: sessionData.ai_recommendation,
    })
  } catch (error) {
    console.error('Prefill error:', error)
    return NextResponse.json({ hasPrefill: false, data: null })
  }
}

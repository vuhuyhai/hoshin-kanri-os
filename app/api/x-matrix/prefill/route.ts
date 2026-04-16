import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcCompleteness } from '@/lib/x-matrix/utils'
import type { XMatrixData } from '@/lib/x-matrix/types'
import type { HoshinCandidate } from '@/lib/swot/types'
import { fromJson } from '@/lib/utils'

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

    // ─── Primary source: active x_matrix (P4 SWOT sync writes here) ──────
    const { data: activeXMatrix } = await supabase
      .from('x_matrices')
      .select('vision_json, updated_at')
      .eq('org_id', org_id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeXMatrix?.vision_json) {
      const vData = fromJson<XMatrixData>(activeXMatrix.vision_json)
      if (vData.hoshins && vData.hoshins.length > 0) {
        return NextResponse.json({
          hasPrefill: true,
          data: vData,
          completeness: calcCompleteness(vData),
          source: 'x_matrices_active',
        })
      }
    }

    // ─── Legacy fallback: discovery_sessions.swot_strategy (pre-P2 Tab A) ──
    const [{ data: strategySession }, { data: visionSession }] = await Promise.all([
      supabase.from('discovery_sessions').select('data_json')
        .eq('org_id', org_id).eq('step_completed', 'swot_strategy').maybeSingle(),
      supabase.from('discovery_sessions').select('data_json')
        .eq('org_id', org_id).eq('step_completed', 'vision').maybeSingle(),
    ])

    if (!strategySession) {
      return NextResponse.json({ hasPrefill: false, data: null })
    }

    const sessionData = fromJson<{
      hoshin_candidates?: HoshinCandidate[]
      ai_recommendation?: string
    } | null>(strategySession.data_json)

    const candidates = sessionData?.hoshin_candidates ?? []
    const selected = candidates.filter((c) => c.selected)

    if (selected.length === 0) {
      return NextResponse.json({ hasPrefill: false, data: null })
    }

    const visionData = fromJson<{
      vision?: string
      year_goals?: string[]
    } | null>(visionSession?.data_json)

    const legacyData: XMatrixData = {
      vision: visionData?.vision ?? '',
      yearGoals: visionData?.year_goals ?? [''],
      hoshins: selected.map((c, idx) => ({
        id: `h${idx + 1}`,
        title: c.title,
        description: c.rationale ?? '',
        kpis: [
          {
            id: `kpi${idx + 1}_1`,
            name: c.kpi_suggestion ?? '',
            unit: inferUnit(c.kpi_suggestion ?? ''),
            targetValue: 0,
            ownerUserId: null,
            ownerName: '',
            frequency: 'monthly' as const,
            deptLevel: 'company' as const,
          },
        ],
        initiatives: [],
      })),
    }

    return NextResponse.json({
      hasPrefill: true,
      data: legacyData,
      completeness: calcCompleteness(legacyData),
      source: 'legacy_discovery_sessions',
    })
  } catch (error) {
    console.error('[x-matrix/prefill] error:', error)
    return NextResponse.json({ hasPrefill: false, data: null })
  }
}

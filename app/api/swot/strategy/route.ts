import { createClient, verifyOrgMembership } from '@/lib/supabase/server'
import {
  generateTowsStrategy,
  generateCellStrategies,
  synthesizeHoshinCandidates,
} from '@/lib/swot/strategy-engine'
import type { CellType, CellSwotItem } from '@/lib/swot/strategy-engine'
import type { SynthesizedSwotItem } from '@/lib/swot/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const action = body.action as string | undefined

  // ─── Action: generate_cell ────────────────────────────────
  // Called by ExtendedSwotMatrix for each TOWS cell
  if (action === 'generate_cell') {
    const { cellType, strengths, weaknesses, opportunities, threats, orgContext } = body as {
      cellType: CellType
      strengths: CellSwotItem[]
      weaknesses: CellSwotItem[]
      opportunities: CellSwotItem[]
      threats: CellSwotItem[]
      orgContext: { name: string; industry: string; headcount: number }
    }

    if (!cellType || !orgContext) {
      return Response.json({ error: 'Thiếu cellType hoặc orgContext' }, { status: 400 })
    }

    try {
      const strategies = await generateCellStrategies(
        cellType, strengths ?? [], weaknesses ?? [], opportunities ?? [], threats ?? [], orgContext,
      )

      if (strategies.length === 0) {
        return Response.json({ error: 'AI không tạo được chiến lược. Thử lại.' }, { status: 500 })
      }

      return Response.json({ strategies })
    } catch (error) {
      console.error(`[strategy] generate_cell ${cellType} error:`, error)
      return Response.json({ error: 'Lỗi tạo chiến lược ô. Thử lại.' }, { status: 500 })
    }
  }

  // ─── Action: synthesize_candidates ────────────────────────
  // Called by StrategyClient after all 4 cells have selected strategies
  if (action === 'synthesize_candidates') {
    const { selectedStrategies, allSwotItems, orgContext } = body as {
      selectedStrategies: Record<CellType, string>
      allSwotItems: CellSwotItem[]
      orgContext: { name: string; industry: string; headcount: number }
    }

    if (!selectedStrategies || !allSwotItems?.length || !orgContext) {
      return Response.json({ error: 'Thiếu dữ liệu chiến lược' }, { status: 400 })
    }

    const hasAnyStrategy = Object.values(selectedStrategies).some((v) => v?.trim())
    if (!hasAnyStrategy) {
      return Response.json({ error: 'Cần chọn ít nhất 1 chiến lược từ các ô TOWS' }, { status: 400 })
    }

    try {
      const candidates = await synthesizeHoshinCandidates(
        selectedStrategies, allSwotItems, orgContext,
      )

      if (candidates.length === 0) {
        return Response.json({ error: 'AI không tạo được Hoshin Candidates. Thử lại.' }, { status: 500 })
      }

      return Response.json({ candidates })
    } catch (error) {
      console.error('[strategy] synthesize_candidates error:', error)
      return Response.json({ error: 'Lỗi tạo Hoshin Candidates. Thử lại.' }, { status: 500 })
    }
  }

  // ─── Legacy: full TOWS generation (no action field) ───────
  // Backward compat: { org_id, swot_items }
  const { org_id, swot_items } = body as {
    org_id: string; swot_items: SynthesizedSwotItem[]
  }

  if (!org_id || !await verifyOrgMembership(supabase, user.id, org_id))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: step3 } = await supabase.from('discovery_sessions')
    .select('id').eq('org_id', org_id).eq('step_completed', 'swot_synthesis').single()
  if (!step3)
    return Response.json({ error: 'Cần hoàn thành Tổng hợp SWOT trước' }, { status: 400 })

  const { data: org } = await supabase.from('organizations')
    .select('name, industry, headcount, city').eq('id', org_id).single()
  if (!org) return Response.json({ error: 'Org not found' }, { status: 404 })

  try {
    const result = await generateTowsStrategy(swot_items, {
      orgId: org_id, orgName: org.name,
      industry: org.industry, headcount: org.headcount, city: org.city,
    })

    await supabase.from('discovery_sessions').upsert({
      org_id, user_id: user.id, step_completed: 'swot_strategy',
      data_json: JSON.parse(JSON.stringify({ ...result, generated_at: new Date().toISOString() })),
    }, { onConflict: 'org_id,step_completed' })

    return Response.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.includes('ít nhất 1 item'))
      return Response.json({ error: msg }, { status: 400 })
    console.error('Strategy error:', error)
    return Response.json({ error: 'Lỗi tạo chiến lược, vui lòng thử lại' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, selected_candidate_ranks } = (await req.json()) as {
    org_id: string; selected_candidate_ranks: number[]
  }
  if (!selected_candidate_ranks?.length || selected_candidate_ranks.length > 5)
    return Response.json({ error: 'Chọn từ 1 đến 5 Hoshin Candidates' }, { status: 400 })

  if (!org_id || !await verifyOrgMembership(supabase, user.id, org_id))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: session } = await supabase.from('discovery_sessions')
    .select('data_json').eq('org_id', org_id).eq('step_completed', 'swot_strategy').single()
  if (!session) return Response.json({ error: 'Session not found' }, { status: 404 })

  const sessionData = session.data_json as unknown as Record<string, unknown>
  const candidates = sessionData.hoshin_candidates as Array<{ rank: number; [key: string]: unknown }>
  const updatedCandidates = candidates.map((c) => ({
    ...c,
    selected: selected_candidate_ranks.includes(c.rank),
  }))

  await supabase.from('discovery_sessions')
    .update({ data_json: { ...sessionData, hoshin_candidates: updatedCandidates } })
    .eq('org_id', org_id).eq('step_completed', 'swot_strategy')

  return Response.json({ success: true, selected_count: selected_candidate_ranks.length })
}

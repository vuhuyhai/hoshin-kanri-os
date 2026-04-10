import { createClient } from '@/lib/supabase/server'
import { generateTowsStrategy } from '@/lib/swot/strategy-engine'
import type { SynthesizedSwotItem } from '@/lib/swot/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, swot_items } = (await req.json()) as {
    org_id: string; swot_items: SynthesizedSwotItem[]
  }

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

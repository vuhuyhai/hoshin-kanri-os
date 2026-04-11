import { createClient, verifyOrgMembership } from '@/lib/supabase/server'
import { synthesizeSwot } from '@/lib/swot/synthesis-engine'
import type { CoachingItem, EvidenceItemV2 } from '@/lib/swot/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id, coaching_items, evidence_items } = (await req.json()) as {
    org_id: string; coaching_items: CoachingItem[]; evidence_items: EvidenceItemV2[]
  }
  if (!coaching_items?.length)
    return Response.json({ error: 'Cần ít nhất 1 coaching item' }, { status: 400 })

  if (!await verifyOrgMembership(supabase, user.id, org_id))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: org } = await supabase.from('organizations')
    .select('name, industry, headcount, city').eq('id', org_id).single()
  if (!org) return Response.json({ error: 'Org not found' }, { status: 404 })

  try {
    const result = await synthesizeSwot(coaching_items, evidence_items, {
      orgId: org_id, orgName: org.name,
      industry: org.industry, headcount: org.headcount, city: org.city,
    })

    await supabase.from('swot_analyses').delete().eq('org_id', org_id)
    await supabase.from('swot_analyses').insert(
      result.swot_items.map((item) => ({
        id: item.id,
        org_id,
        quadrant: item.quadrant,
        framework_source: '',
        statement: item.statement,
        evidence_json: {
          text: item.evidence, source: item.evidence_source ?? null,
          url: item.evidence_url ?? null, year: item.evidence_year ?? null,
          credibility_score: item.credibility_score,
        },
        implication: item.implication,
      }))
    )

    await supabase.from('discovery_sessions').upsert({
      org_id, user_id: user.id, step_completed: 'swot_synthesis',
      data_json: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        items: result.swot_items,
        stats: result.stats,
        merge_log: result.merge_log,
      },
    }, { onConflict: 'org_id,step_completed' })

    return Response.json(result)
  } catch (error) {
    console.error('Synthesis error:', error)
    return Response.json({ error: 'Lỗi tổng hợp SWOT, vui lòng thử lại' }, { status: 500 })
  }
}

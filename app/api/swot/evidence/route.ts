import type { NextRequest } from 'next/server'
import { createClient, verifyOrgMembership } from '@/lib/supabase/server'
import { generateQueriesForItem } from '@/lib/swot/query-generator'
import { searchEvidenceForItem } from '@/lib/swot/evidence-searcher'
import pLimit from 'p-limit'
import type { CoachingItem, EvidenceResult, OrgContext } from '@/lib/swot/types'
import { parseBody, swotEvidenceSchema } from '@/lib/validation'
import { toJson } from '@/lib/utils'

const limit = pLimit(4)

function buildCacheKey(text: string, industry: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50)
  return `evidence:${industry}:${normalized}`
}

interface EvidenceResultItem {
  item: CoachingItem
  evidence: EvidenceResult
  from_cache?: boolean
  queries_used?: string[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseBody(req, swotEvidenceSchema)
  if (!parsed.ok) return parsed.response
  const items = parsed.data.items as unknown as CoachingItem[]
  const org_id = parsed.data.org_id

  if (!(await verifyOrgMembership(supabase, user.id, org_id)))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { data: org } = await supabase.from('organizations')
    .select('name, industry, headcount, city').eq('id', org_id).single()
  if (!org) return Response.json({ error: 'Org not found' }, { status: 404 })

  const orgContext: OrgContext = {
    orgId: org_id, orgName: org.name,
    industry: org.industry, headcount: org.headcount, city: org.city,
  }

  const results = await Promise.allSettled(
    items.map((item) => limit(async (): Promise<EvidenceResultItem> => {
      const cacheKey = buildCacheKey(item.text, org.industry)
      const { data: cached } = await supabase.from('evidence_cache').select('result_json').eq('cache_key', cacheKey).gt('expires_at', new Date().toISOString()).single()
      if (cached) return { item, evidence: (cached as unknown as { result_json: EvidenceResult }).result_json, from_cache: true }

      const queries = await generateQueriesForItem(item, orgContext)
      const evidence = await searchEvidenceForItem(item, queries)

      if (evidence.found) {
        const expires = new Date()
        expires.setDate(expires.getDate() + 7)
        await supabase.from('evidence_cache').upsert({ cache_key: cacheKey, result_json: toJson(evidence), expires_at: expires.toISOString() })
      }

      return { item, evidence, queries_used: queries.map((q) => q.query) }
    })),
  )

  const fulfilled = results.filter((r): r is PromiseFulfilledResult<EvidenceResultItem> => r.status === 'fulfilled')

  return Response.json({
    validated:  fulfilled.filter((r) => r.value.evidence.found).map((r) => r.value),
    not_found:  fulfilled.filter((r) => !r.value.evidence.found).map((r) => r.value.item.text),
    failed:     results.filter((r) => r.status === 'rejected').length,
    total:      items.length,
    cache_hits: fulfilled.filter((r) => r.value.from_cache).length,
  })
}

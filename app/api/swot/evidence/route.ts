import { createClient } from '@/lib/supabase/server'
import { generateQueriesForItem } from '@/lib/swot/query-generator'
import { searchEvidenceForItem } from '@/lib/swot/evidence-searcher'
import pLimit from 'p-limit'
import type { CoachingItem, EvidenceResult, OrgContext } from '@/lib/swot/types'

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

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { items, org_id } = (await req.json()) as { items: CoachingItem[]; org_id: string }
  if (!items?.length) return Response.json({ error: 'Cần ít nhất 1 item' }, { status: 400 })

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
      if (cached) return { item, evidence: (cached as { result_json: EvidenceResult }).result_json, from_cache: true }

      const queries = await generateQueriesForItem(item, orgContext)
      const evidence = await searchEvidenceForItem(item, queries)

      if (evidence.found) {
        const expires = new Date()
        expires.setDate(expires.getDate() + 7)
        // @ts-expect-error evidence_cache not in generated Supabase types (migration 006)
        await supabase.from('evidence_cache').upsert({ cache_key: cacheKey, result_json: evidence, expires_at: expires.toISOString() })
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

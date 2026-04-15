import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAnthropicClient } from '@/lib/ai/client'
import { AI_MODELS } from '@/lib/ai/models'
import { parseBody, swotItemEvidenceSchema } from '@/lib/validation'
import type {
  TavilyEvidenceResult,
  ItemEvidenceResponse,
} from '@/lib/swot/types'
import type { Json } from '@/lib/supabase/types'

const CACHE_TTL_DAYS = 7

interface TavilyRaw {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

function buildCacheKey(query: string, analysisId?: string): string {
  const norm = query.toLowerCase().trim().replace(/\s+/g, '_').slice(0, 80)
  return `item-evidence:${norm}${analysisId ? `:${analysisId}` : ''}`
}

async function generateQuery(
  statement: string,
  quadrant: string,
  orgContext: string,
): Promise<string> {
  const client = createAnthropicClient()
  const res = await client.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Tạo 1 search query tiếng Anh (dưới 10 từ) để tìm evidence cho SWOT factor sau của doanh nghiệp Việt Nam. Factor [${quadrant}]: ${statement}. Bối cảnh: ${orgContext}. Trả về chỉ query string, không giải thích.`,
    }],
  })
  const block = res.content[0]
  if (!block || block.type !== 'text') throw new Error('no_query_text')
  return block.text.trim().replace(/^["']|["']$/g, '')
}

async function searchTavily(query: string): Promise<TavilyEvidenceResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    }),
  })
  if (!res.ok) throw new Error(`tavily_http_${res.status}`)
  const data = (await res.json()) as { results?: TavilyRaw[] }
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
    score: r.score,
    published_date: r.published_date,
  }))
}

export async function POST(request: NextRequest) {
  const bodyParsed = await parseBody(request, swotItemEvidenceSchema)
  if (!bodyParsed.ok) return bodyParsed.response
  const { statement, quadrant, orgContext, analysisId } = bodyParsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query: string
  try {
    query = await generateQuery(statement, quadrant, orgContext)
  } catch (err) {
    console.error('[item-evidence] query generation failed:', err)
    return NextResponse.json({ error: 'query_generation_failed' }, { status: 500 })
  }

  const cacheKey = buildCacheKey(query, analysisId)
  const { data: cached } = await supabase
    .from('evidence_cache')
    .select('result_json')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (cached) {
    const results = (cached as unknown as { result_json: TavilyEvidenceResult[] }).result_json
    return NextResponse.json<ItemEvidenceResponse>({ query, results, cached: true })
  }

  let results: TavilyEvidenceResult[]
  try {
    results = await searchTavily(query)
  } catch (err) {
    console.error('[item-evidence] tavily search failed:', err)
    return NextResponse.json({ query, results: [], error: 'search_failed' })
  }

  if (results.length > 0) {
    const expires = new Date()
    expires.setDate(expires.getDate() + CACHE_TTL_DAYS)
    await supabase.from('evidence_cache').upsert({
      cache_key: cacheKey,
      result_json: results as unknown as Json,
      expires_at: expires.toISOString(),
    })
  }

  return NextResponse.json<ItemEvidenceResponse>({ query, results, cached: false })
}

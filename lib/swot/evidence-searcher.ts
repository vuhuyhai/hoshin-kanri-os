import { ALL_CREDIBLE_DOMAINS, DOMAIN_WEIGHT_MAP } from './evidence-sources'
import type { CoachingItem, GeneratedQuery, EvidenceResult } from './types'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'

const anthropic = createAnthropicClient()
const CURRENT_YEAR = new Date().getFullYear()

interface RawSearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

const NOT_FOUND: EvidenceResult = {
  found: false,
  confidence: 'not_found',
  confidence_reason: 'No results found',
  credibility_score: 0,
}

async function searchTavily(query: string, days: number): Promise<RawSearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 5,
      search_depth: 'advanced',
      days,
      include_domains: ALL_CREDIBLE_DOMAINS,
      include_raw_content: false,
    }),
  })
  if (!res.ok) return []
  const data = (await res.json()) as { results?: RawSearchResult[] }
  return data.results ?? []
}

function deduplicateByDomain(results: RawSearchResult[]): RawSearchResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    try {
      const domain = new URL(r.url).hostname.replace('www.', '')
      if (seen.has(domain)) return false
      seen.add(domain)
      return true
    } catch {
      return false
    }
  })
}

function scoreResult(r: RawSearchResult): number {
  let score = 0
  try {
    const domain = new URL(r.url).hostname.replace('www.', '')
    score += DOMAIN_WEIGHT_MAP[domain] ?? 2
  } catch {
    score += 2
  }
  score += r.score * 5
  if (r.published_date) {
    const year = new Date(r.published_date).getFullYear()
    if (year === CURRENT_YEAR) score += 3
    else if (year === CURRENT_YEAR - 1) score += 2
    else if (year === CURRENT_YEAR - 2) score += 1
  }
  if (/\d+[%,.]?\d*\s*(tỷ|triệu|nghìn|%|tăng|giảm)/i.test(r.content)) score += 2
  return Math.min(score, 10)
}

async function extractEvidenceWithClaude(
  item: CoachingItem,
  results: RawSearchResult[],
): Promise<EvidenceResult> {
  const sourcesText = results
    .map((r) => {
      let domain = r.url
      try { domain = new URL(r.url).hostname } catch { /* keep raw url */ }
      return `[${domain}] ${r.url}\nNgày: ${r.published_date ?? 'N/A'}\n${r.content}`
    })
    .join('\n\n---\n\n')

  try {
    const message = await anthropic.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 400,
      system: `Bạn là chuyên gia phân tích dữ liệu thị trường Việt Nam.
Nhiệm vụ: Extract số liệu cụ thể nhất từ kết quả tìm kiếm làm bằng chứng SWOT.
Ưu tiên: Con số cụ thể > % > xu hướng > nhận định chung.
Chỉ trả về JSON hợp lệ.`,
      messages: [{
        role: 'user',
        content: `Nhận định SWOT (${item.quadrant}): "${item.text}"

Kết quả tìm kiếm:
${sourcesText}

Trả về JSON:
NẾU TÌM THẤY: { "found": true, "evidence_text": "...", "data_point": "...", "source_name": "...", "source_url": "...", "published_year": 2024, "confidence": "high|medium|low", "confidence_reason": "...", "credibility_score": 1-10 }
NẾU KHÔNG: { "found": false, "confidence": "not_found", "confidence_reason": "...", "credibility_score": 0 }

Confidence:
"high": Nguồn chính phủ/research firm + số liệu + trong 2 năm gần nhất
"medium": Báo uy tín + số liệu nhưng không từ primary source
"low": Có liên quan nhưng số liệu cũ >3 năm`,
      }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return NOT_FOUND

    const cleaned = block.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as EvidenceResult
  } catch {
    return { found: false, confidence: 'not_found', confidence_reason: 'Parse error', credibility_score: 0 }
  }
}

export async function searchEvidenceForItem(
  item: CoachingItem,
  queries: GeneratedQuery[],
): Promise<EvidenceResult> {
  const batches = await Promise.all(
    queries.map((q) => searchTavily(q.query, q.days).catch((): RawSearchResult[] => [])),
  )
  const flat = deduplicateByDomain(batches.flat())
  if (flat.length === 0) return NOT_FOUND

  const scored = flat.map((r) => ({ r, s: scoreResult(r) })).sort((a, b) => b.s - a.s)
  const top3 = scored.slice(0, 3).map((x) => x.r)
  return extractEvidenceWithClaude(item, top3)
}

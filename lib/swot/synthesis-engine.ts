import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'
import type { CoachingItem, EvidenceItemV2, OrgContext, SynthesizedSwotItem, SynthesisResult } from './types'
import { AI_MODELS } from '@/lib/ai/models'

const anthropic = new Anthropic()

function buildSynthesisPrompt(coaching: CoachingItem[], evidence: EvidenceItemV2[], org: OrgContext): string {
  const byQ = <T extends { quadrant: string }>(items: T[], q: string) => items.filter((i) => i.quadrant === q)

  const fmtCoach = (items: CoachingItem[]) =>
    items.length ? items.map((i) => `  [${i.id}] "${i.text}" (${i.source})`).join('\n') : '  (không có)'

  const fmtEvid = (items: EvidenceItemV2[]) =>
    items.length
      ? items.map((i) => {
          let line = `  [${i.id}] "${i.text}"`
          if (i.data_point) line += ` — ${i.data_point}`
          if (i.source_name) line += ` (${i.source_name})`
          if (i.published_year) line += ` [${i.published_year}]`
          if (i.is_new_discovery) line += ' [MỚI]'
          return line
        }).join('\n')
      : '  (không có)'

  return `Ngành: ${org.industry} | Quy mô: ${org.headcount} | Thành phố: ${org.city}

═══ COACHING ITEMS ═══
[S]:\n${fmtCoach(byQ(coaching, 'S'))}
[W]:\n${fmtCoach(byQ(coaching, 'W'))}
[O]:\n${fmtCoach(byQ(coaching, 'O'))}
[T]:\n${fmtCoach(byQ(coaching, 'T'))}

═══ EVIDENCE ITEMS ═══
[S]:\n${fmtEvid(byQ(evidence, 'S'))}
[W]:\n${fmtEvid(byQ(evidence, 'W'))}
[O]:\n${fmtEvid(byQ(evidence, 'O'))}
[T]:\n${fmtEvid(byQ(evidence, 'T'))}

═══ NHIỆM VỤ ═══
Tổng hợp theo 4 quy tắc:
MERGE: Cùng chủ đề → gộp 1 item, lấy statement rõ nhất + evidence tốt nhất
ENRICH: Item chưa có số liệu + có evidence liên quan → gắn evidence vào
DISCARD: Quá chung + không có evidence → loại bỏ
LIMIT: Tối đa 5 items/quadrant, ưu tiên evidence mạnh nhất

OUTPUT JSON:
{
  "swot_items": [{
    "quadrant": "S|W|O|T",
    "statement": "Rõ ràng, có thể đo, tối đa 12 từ",
    "evidence": "Số liệu cụ thể + nguồn + năm — BẮT BUỘC có con số",
    "evidence_source": "Tên nguồn", "evidence_url": "URL", "evidence_year": 2024,
    "implication": "Tại sao quan trọng với chiến lược — 1 câu kết nối",
    "priority": 1, "merged_from": ["id1", "id2"], "credibility_score": 8.5
  }],
  "merge_log": [{ "merged_ids": ["id1","id2"], "into_item": "...", "reason": "..." }],
  "discarded": [{ "original_text": "...", "reason": "..." }]
}

TIÊU CHUẨN CHẤT LƯỢNG:
Statement PHẢI specific: không "dịch vụ tốt" mà "NPS 72, top 15% ngành"
Evidence PHẢI có: con số + tên nguồn + năm
Implication PHẢI chiến lược: kết nối với cơ hội/thách thức cụ thể
Tổng cộng KHÔNG quá 16 items`
}

function parseAndEnrichSynthesis(
  raw: string,
  coaching: CoachingItem[],
  evidence: EvidenceItemV2[],
): SynthesisResult {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      swot_items: Array<Omit<SynthesizedSwotItem, 'id'> & { credibility_score?: number }>
      merge_log?: SynthesisResult['merge_log']
      discarded?: SynthesisResult['discarded']
    }

    const swot_items: SynthesizedSwotItem[] = parsed.swot_items.map((item) => ({
      ...item,
      id: randomUUID(),
      credibility_score: item.credibility_score ?? 5,
    }))

    return {
      swot_items,
      merge_log: parsed.merge_log ?? [],
      discarded: parsed.discarded ?? [],
      stats: {
        total_input: coaching.length + evidence.length,
        total_output: swot_items.length,
        merged_count: (parsed.merge_log ?? []).length,
        discarded_count: (parsed.discarded ?? []).length,
      },
    }
  } catch {
    const swot_items: SynthesizedSwotItem[] = coaching.map((c) => ({
      id: randomUUID(),
      quadrant: c.quadrant,
      statement: c.text,
      evidence: 'Chưa có số liệu cụ thể',
      implication: 'Cần phân tích thêm',
      priority: 3 as const,
      credibility_score: 4,
    }))

    return {
      swot_items,
      merge_log: [],
      discarded: [],
      stats: {
        total_input: coaching.length + evidence.length,
        total_output: coaching.length,
        merged_count: 0,
        discarded_count: 0,
      },
    }
  }
}

export async function synthesizeSwot(
  coachingItems: CoachingItem[],
  evidenceItems: EvidenceItemV2[],
  org: OrgContext,
): Promise<SynthesisResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 55000)

  try {
    const message = await anthropic.messages.create(
      {
        model: AI_MODELS.reasoning,
        max_tokens: 2000,
        system: `Bạn là chuyên gia tư vấn chiến lược Hoshin Kanri.
Nguyên tắc: "No one benefits from vague statements. Be clear and detailed.
Put figures on the current condition." — Melander (2021)
Chỉ trả về JSON hợp lệ.`,
        messages: [{ role: 'user', content: buildSynthesisPrompt(coachingItems, evidenceItems, org) }],
      },
      { signal: controller.signal },
    )
    clearTimeout(timeoutId)

    const block = message.content[0]
    if (block.type !== 'text') return parseAndEnrichSynthesis('{}', coachingItems, evidenceItems)
    return parseAndEnrichSynthesis(block.text, coachingItems, evidenceItems)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('AI synthesis timeout sau 55 giây. Vui lòng thử lại.')
    }
    return parseAndEnrichSynthesis('{}', coachingItems, evidenceItems)
  }
}

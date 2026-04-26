import { randomUUID } from 'crypto'
import type Anthropic from '@anthropic-ai/sdk'
import type {
  CoachingItem,
  EvidenceItemV2,
  OrgContext,
  SynthesizedSwotItem,
  SynthesisResult,
} from './types'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'

function buildSynthesisPrompt(
  coaching: CoachingItem[],
  evidence: EvidenceItemV2[],
  org: OrgContext,
): string {
  const byQ = <T extends { quadrant: string }>(items: T[], q: string) =>
    items.filter((i) => i.quadrant === q)

  const fmtCoach = (items: CoachingItem[]) =>
    items.length
      ? items.map((i) => `  [${i.id}] "${i.text}" (${i.source})`).join('\n')
      : '  (không có)'

  const fmtEvid = (items: EvidenceItemV2[]) =>
    items.length
      ? items
          .map((i) => {
            let line = `  [${i.id}] "${i.text}"`
            if (i.data_point) line += ` — ${i.data_point}`
            if (i.source_name) line += ` (${i.source_name})`
            if (i.published_year) line += ` [${i.published_year}]`
            if (i.is_new_discovery) line += ' [MỚI]'
            return line
          })
          .join('\n')
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

TIÊU CHUẨN CHẤT LƯỢNG:
- Statement PHẢI specific: không "dịch vụ tốt" mà "NPS 72, top 15% ngành"
- Evidence PHẢI có: con số + tên nguồn + năm
- Implication PHẢI chiến lược: kết nối với cơ hội/thách thức cụ thể
- Tổng cộng KHÔNG quá 16 items

Gọi tool submit_swot_synthesis với kết quả.`
}

const SWOT_SYNTHESIS_TOOL: Anthropic.Tool = {
  name: 'submit_swot_synthesis',
  description:
    'Submit a merged/enriched SWOT analysis synthesizing coaching items and evidence into final strategic statements.',
  input_schema: {
    type: 'object',
    properties: {
      swot_items: {
        type: 'array',
        minItems: 1,
        maxItems: 16,
        items: {
          type: 'object',
          properties: {
            quadrant: { type: 'string', enum: ['S', 'W', 'O', 'T'] },
            statement: {
              type: 'string',
              description: 'Rõ ràng, có thể đo, tối đa 12 từ',
            },
            evidence: {
              type: 'string',
              description:
                'Số liệu cụ thể + nguồn + năm — BẮT BUỘC có con số',
            },
            evidence_source: { type: 'string' },
            evidence_url: { type: 'string' },
            evidence_year: { type: 'number' },
            implication: {
              type: 'string',
              description: 'Tại sao quan trọng với chiến lược — 1 câu',
            },
            priority: { type: 'number', enum: [1, 2, 3, 4, 5] },
            merged_from: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of input items merged into this output',
            },
            credibility_score: {
              type: 'number',
              description: '0-10, dựa trên độ mạnh của evidence',
            },
          },
          required: [
            'quadrant',
            'statement',
            'evidence',
            'implication',
            'priority',
            'credibility_score',
          ],
        },
      },
      merge_log: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            merged_ids: { type: 'array', items: { type: 'string' } },
            into_item: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['merged_ids', 'into_item', 'reason'],
        },
      },
      discarded: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original_text: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['original_text', 'reason'],
        },
      },
    },
    required: ['swot_items', 'merge_log', 'discarded'],
  },
}

interface RawSynthesisOutput {
  swot_items: Array<Omit<SynthesizedSwotItem, 'id'>>
  merge_log: SynthesisResult['merge_log']
  discarded: SynthesisResult['discarded']
}

async function callSynthesisAI(
  client: Anthropic,
  prompt: string,
  signal: AbortSignal,
): Promise<RawSynthesisOutput> {
  const response = await client.messages.create(
    {
      model: AI_MODELS.reasoning,
      max_tokens: 8192,
      system: `Bạn là chuyên gia tư vấn chiến lược Hoshin Kanri.
Nguyên tắc: "No one benefits from vague statements. Be clear and detailed.
Put figures on the current condition." — Melander (2021)
Gọi tool submit_swot_synthesis với output có cấu trúc.`,
      tools: [SWOT_SYNTHESIS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_swot_synthesis' },
      messages: [{ role: 'user', content: prompt }],
    },
    { signal },
  )

  if (response.stop_reason === 'max_tokens') {
    throw new Error('max_tokens')
  }

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolBlock) {
    throw new Error('no_tool_use')
  }

  const parsed = toolBlock.input as Partial<RawSynthesisOutput>

  if (!Array.isArray(parsed.swot_items) || parsed.swot_items.length === 0) {
    throw new Error('missing_swot_items')
  }
  for (let i = 0; i < parsed.swot_items.length; i++) {
    const item = parsed.swot_items[i]
    if (!item || typeof item !== 'object') {
      throw new Error(`invalid_item_${i}`)
    }
    if (!['S', 'W', 'O', 'T'].includes(item.quadrant)) {
      throw new Error(`invalid_quadrant_${i}`)
    }
    if (typeof item.statement !== 'string' || !item.statement.trim()) {
      throw new Error(`missing_statement_${i}`)
    }
  }

  return {
    swot_items: parsed.swot_items,
    merge_log: Array.isArray(parsed.merge_log) ? parsed.merge_log : [],
    discarded: Array.isArray(parsed.discarded) ? parsed.discarded : [],
  }
}

function toSynthesisResult(
  raw: RawSynthesisOutput,
  coaching: CoachingItem[],
  evidence: EvidenceItemV2[],
): SynthesisResult {
  const swot_items: SynthesizedSwotItem[] = raw.swot_items.map((item) => ({
    ...item,
    id: randomUUID(),
    credibility_score: item.credibility_score ?? 5,
  }))

  return {
    swot_items,
    merge_log: raw.merge_log,
    discarded: raw.discarded,
    stats: {
      total_input: coaching.length + evidence.length,
      total_output: swot_items.length,
      merged_count: raw.merge_log.length,
      discarded_count: raw.discarded.length,
    },
  }
}

export async function synthesizeSwot(
  coachingItems: CoachingItem[],
  evidenceItems: EvidenceItemV2[],
  org: OrgContext,
): Promise<SynthesisResult> {
  const client = createAnthropicClient()
  const prompt = buildSynthesisPrompt(coachingItems, evidenceItems, org)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 110_000)

  try {
    let raw: RawSynthesisOutput
    let firstReason = ''
    try {
      raw = await callSynthesisAI(client, prompt, controller.signal)
    } catch (firstErr) {
      if (firstErr instanceof Error && firstErr.name === 'AbortError') {
        throw new Error('AI synthesis timeout sau 110 giây. Vui lòng thử lại.')
      }
      firstReason = (firstErr as Error).message
      console.warn('[synthesis] first attempt failed, retrying:', firstReason)
      try {
        raw = await callSynthesisAI(client, prompt, controller.signal)
      } catch (secondErr) {
        if (secondErr instanceof Error && secondErr.name === 'AbortError') {
          throw new Error('AI synthesis timeout sau 110 giây. Vui lòng thử lại.')
        }
        const secondReason = (secondErr as Error).message
        throw new Error(
          `AI trả về định dạng không hợp lệ (${secondReason}). Thử lại.`,
        )
      }
    }
    return toSynthesisResult(raw, coachingItems, evidenceItems)
  } finally {
    clearTimeout(timeoutId)
  }
}

import Anthropic from '@anthropic-ai/sdk'
import type { SynthesizedSwotItem, OrgContext, TowsResult, HoshinCandidate } from './types'

const anthropic = new Anthropic()

function buildTowsPrompt(items: SynthesizedSwotItem[], org: OrgContext): string {
  const byQ = (q: string) =>
    items
      .filter((i) => i.quadrant === q)
      .sort((a, b) => a.priority - b.priority)
      .map((i) => `  [${i.id.slice(0, 8)}] (P${i.priority}) ${i.statement}\n    → ${i.evidence}`)
      .join('\n')

  return `Ngành: ${org.industry} | Quy mô: ${org.headcount} | Thành phố: ${org.city}

STRENGTHS (S):
${byQ('S')}
WEAKNESSES (W):
${byQ('W')}
OPPORTUNITIES (O):
${byQ('O')}
THREATS (T):
${byQ('T')}

═══ NHIỆM VỤ: TẠO TOWS MATRIX + HOSHIN CANDIDATES ═══

TOWS LOGIC:
SO (S × O): Chiến lược TẤN CÔNG — dùng S khai thác O
ST (S × T): Chiến lược BẢO VỆ — dùng S counter T
WO (W × O): Chiến lược CẢI THIỆN — dùng O khắc phục W
WT (W × T): Chiến lược PHÒNG THỦ — minimize rủi ro

SCORING FORMULA:
Score = (Impact × 0.4) + (Feasibility × 0.35) + (Evidence × 0.25)
Impact (0-10): Tác động đến revenue/growth trong 12 tháng
Feasibility (0-10): Khả năng thực thi với team ${org.headcount} người
Evidence (0-10): Bằng chứng thị trường ủng hộ strategy này

OUTPUT JSON:
{
  "tows_strategies": {
    "SO": [{ "strategy": "Tối đa 15 từ", "s_item_ids": [], "o_item_ids": [], "w_item_ids": [], "t_item_ids": [] }],
    "ST": [...], "WO": [...], "WT": [...]
  },
  "hoshin_candidates": [{
    "rank": 1, "title": "Động từ + mục tiêu — tối đa 8 từ",
    "type": "SO|ST|WO|WT",
    "rationale": "Câu 1: Tại sao ưu tiên cao nhất. Câu 2: Tác động cụ thể.",
    "score": 9.2, "score_breakdown": { "impact": 9, "feasibility": 9, "evidence": 10 },
    "linked_item_ids": { "s": [], "w": [], "o": [], "t": [] },
    "kpi_suggestion": "Tên KPI đo lường Hoshin này",
    "timeframe": "90_days|6_months|12_months"
  }],
  "ai_recommendation": "2-3 câu tóm tắt logic top 3 candidates, balance tấn công vs bảo vệ"
}

RÀNG BUỘC:
Title BẮT ĐẦU bằng động từ hành động: "Mở rộng", "Xây dựng", "Tối ưu", "Triển khai"
Tối đa 5 Hoshin Candidates — không hơn
Timeframe phải thực tế với quy mô ${org.headcount} nhân viên
Ưu tiên SO (growth) trước ST/WO/WT`
}

function parseTowsResult(raw: string, _items: SynthesizedSwotItem[]): TowsResult {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as TowsResult

    const sorted = [...parsed.hoshin_candidates].sort((a, b) => b.score - a.score).slice(0, 5)
    parsed.hoshin_candidates = sorted.map((c: HoshinCandidate, i: number) => ({
      ...c,
      rank: i + 1,
      score: Math.min(10, Math.max(0, c.score)),
      selected: i < 3,
    }))

    return parsed
  } catch {
    return {
      tows_strategies: { SO: [], ST: [], WO: [], WT: [] },
      hoshin_candidates: [],
      ai_recommendation: 'Lỗi generate. Vui lòng thử lại.',
    }
  }
}

export async function generateTowsStrategy(
  swotItems: SynthesizedSwotItem[],
  org: OrgContext,
): Promise<TowsResult> {
  const counts = { S: 0, W: 0, O: 0, T: 0 }
  for (const item of swotItems) counts[item.quadrant]++
  if (counts.S < 1 || counts.W < 1 || counts.O < 1 || counts.T < 1) {
    throw new Error('SWOT cần ít nhất 1 item mỗi quadrant để tạo TOWS strategies')
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: `Bạn là chuyên gia Hoshin Kanri với 15 năm kinh nghiệm tư vấn SME Đông Nam Á.
Nguyên tắc Jackson (2006): "Keep breakthroughs between 3-5. Strongly resist doing more."
Chỉ trả về JSON hợp lệ.`,
      messages: [{ role: 'user', content: buildTowsPrompt(swotItems, org) }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return parseTowsResult('{}', swotItems)
    return parseTowsResult(block.text, swotItems)
  } catch {
    return parseTowsResult('{}', swotItems)
  }
}

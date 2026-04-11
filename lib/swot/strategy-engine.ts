import Anthropic from '@anthropic-ai/sdk'
import type { SynthesizedSwotItem, OrgContext, TowsResult, HoshinCandidate } from './types'

const anthropic = new Anthropic()

// ============================================================
// FULL TOWS GENERATION (original — used by legacy POST route)
// ============================================================

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

// ============================================================
// CELL-LEVEL STRATEGY GENERATION (for ExtendedSwotMatrix UI)
// ============================================================

export interface CellSwotItem {
  id: string
  category: string
  statement: string
}

export type CellType = 'SO' | 'ST' | 'WO' | 'WT'

const CELL_LOGIC: Record<CellType, { name: string; desc: string }> = {
  SO: { name: 'TẤN CÔNG', desc: 'Dùng điểm mạnh khai thác cơ hội' },
  ST: { name: 'BẢO VỆ', desc: 'Dùng điểm mạnh chống lại thách thức' },
  WO: { name: 'CẢI THIỆN', desc: 'Tận dụng cơ hội để khắc phục điểm yếu' },
  WT: { name: 'PHÒNG THỦ', desc: 'Giảm thiểu rủi ro từ điểm yếu + thách thức' },
}

function buildCellPrompt(
  cellType: CellType,
  strengths: CellSwotItem[],
  weaknesses: CellSwotItem[],
  opportunities: CellSwotItem[],
  threats: CellSwotItem[],
  orgContext: { name: string; industry: string; headcount: number },
): string {
  const fmtItems = (items: CellSwotItem[]) =>
    items.length > 0
      ? items.map((i) => `  - ${i.statement}`).join('\n')
      : '  (không có)'

  const logic = CELL_LOGIC[cellType]

  return `Doanh nghiệp: ${orgContext.name} | Ngành: ${orgContext.industry} | ${orgContext.headcount} nhân viên

Ô ${cellType} — Chiến lược ${logic.name}: ${logic.desc}

${strengths.length > 0 ? `STRENGTHS:\n${fmtItems(strengths)}` : ''}
${weaknesses.length > 0 ? `WEAKNESSES:\n${fmtItems(weaknesses)}` : ''}
${opportunities.length > 0 ? `OPPORTUNITIES:\n${fmtItems(opportunities)}` : ''}
${threats.length > 0 ? `THREATS:\n${fmtItems(threats)}` : ''}

Tạo ĐÚNG 3 chiến lược ${logic.name} cho ô ${cellType}.
Mỗi chiến lược:
- Tối đa 20 từ
- Bắt đầu bằng động từ hành động
- Cụ thể, đo lường được, phù hợp quy mô ${orgContext.headcount} người
- Kết nối trực tiếp các SWOT items phía trên

OUTPUT: Chỉ JSON, không markdown.
{ "strategies": ["Chiến lược 1", "Chiến lược 2", "Chiến lược 3"] }`
}

export async function generateCellStrategies(
  cellType: CellType,
  strengths: CellSwotItem[],
  weaknesses: CellSwotItem[],
  opportunities: CellSwotItem[],
  threats: CellSwotItem[],
  orgContext: { name: string; industry: string; headcount: number },
): Promise<string[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Bạn là chuyên gia chiến lược Hoshin Kanri cho SME Việt Nam. Chỉ trả về JSON hợp lệ.`,
      messages: [{
        role: 'user',
        content: buildCellPrompt(cellType, strengths, weaknesses, opportunities, threats, orgContext),
      }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return []

    const cleaned = block.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as { strategies: string[] }
    return (parsed.strategies ?? []).slice(0, 3)
  } catch (err) {
    console.error(`[strategy-engine] generateCellStrategies ${cellType} error:`, err)
    return []
  }
}

// ============================================================
// HOSHIN CANDIDATES FROM SELECTED STRATEGIES (for StrategyClient UI)
// ============================================================

// Reuses HoshinCandidate from swot-session-store (single source of truth)
import type { HoshinCandidate as StoreHoshinCandidate } from '@/lib/swot/swot-session-store'

function buildCandidatesPrompt(
  selectedStrategies: Record<CellType, string>,
  allItems: CellSwotItem[],
  orgContext: { name: string; industry: string; headcount: number },
): string {
  const fmtItems = (cat: string) =>
    allItems.filter((i) => i.category === cat).map((i) => `  - [${i.id.slice(0, 8)}] ${i.statement}`).join('\n')

  return `Doanh nghiệp: ${orgContext.name} | Ngành: ${orgContext.industry} | ${orgContext.headcount} nhân viên

SWOT ITEMS:
S:\n${fmtItems('S')}
W:\n${fmtItems('W')}
O:\n${fmtItems('O')}
T:\n${fmtItems('T')}

CHIẾN LƯỢC ĐÃ CHỌN:
SO: ${selectedStrategies.SO || '(chưa chọn)'}
ST: ${selectedStrategies.ST || '(chưa chọn)'}
WO: ${selectedStrategies.WO || '(chưa chọn)'}
WT: ${selectedStrategies.WT || '(chưa chọn)'}

═══ NHIỆM VỤ: TẠO HOSHIN CANDIDATES ═══

Từ 4 chiến lược đã chọn, tổng hợp thành 3-5 Hoshin Candidates.
Mỗi candidate là một MỤC TIÊU ĐỘT PHÁ có thể đưa vào X-Matrix.

OUTPUT JSON:
{
  "candidates": [{
    "name": "Động từ + mục tiêu — tối đa 10 từ",
    "description": "1-2 câu mô tả cụ thể mục tiêu và cách đạt được",
    "sourceCellType": "SO|ST|WO|WT",
    "sourceItemIds": ["id1", "id2"],
    "priority": 1,
    "suggestedKpis": ["KPI 1", "KPI 2"]
  }]
}

RÀNG BUỘC:
- Name BẮT ĐẦU bằng động từ: "Mở rộng", "Xây dựng", "Tối ưu", "Triển khai"
- Tối đa 5 candidates, xếp theo priority (1 = cao nhất)
- suggestedKpis: 2-3 KPIs đo lường được
- sourceItemIds: danh sách ID các SWOT items liên quan (dùng 8 ký tự đầu)
- Ưu tiên SO > WT > ST/WO`
}

export async function synthesizeHoshinCandidates(
  selectedStrategies: Record<CellType, string>,
  allItems: CellSwotItem[],
  orgContext: { name: string; industry: string; headcount: number },
): Promise<StoreHoshinCandidate[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Bạn là chuyên gia Hoshin Kanri. Nguyên tắc Jackson (2006): "Keep breakthroughs between 3-5."
Chỉ trả về JSON hợp lệ.`,
      messages: [{
        role: 'user',
        content: buildCandidatesPrompt(selectedStrategies, allItems, orgContext),
      }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return []

    const cleaned = block.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      candidates: Array<{
        name: string
        description: string
        sourceCellType: CellType
        sourceItemIds: string[]
        priority: number
        suggestedKpis: string[]
      }>
    }

    return (parsed.candidates ?? []).slice(0, 5).map((c, i) => ({
      id: crypto.randomUUID(),
      name: c.name,
      description: c.description,
      sourceCellType: c.sourceCellType,
      sourceItemIds: c.sourceItemIds ?? [],
      priority: Math.min(5, Math.max(1, c.priority ?? (i + 1))) as 1 | 2 | 3 | 4 | 5,
      suggestedKpis: c.suggestedKpis ?? [],
      isSelectedForXMatrix: false,
    }))
  } catch (err) {
    console.error('[strategy-engine] synthesizeHoshinCandidates error:', err)
    return []
  }
}

import Anthropic from '@anthropic-ai/sdk'
import type {
  ExtendedCellType,
  SwotItem,
  HoshinCandidate,
  SwotSession,
} from '@/lib/swot/swot-session-store'

// ============================================================
// TYPES
// ============================================================

export interface OrgContext {
  name: string
  industry: string
  headcount: number
}

// ============================================================
// HELPERS
// ============================================================

const CELL_LABELS: Record<ExtendedCellType, string> = {
  SO: 'dùng điểm mạnh để khai thác cơ hội (growth strategy)',
  ST: 'dùng điểm mạnh để phòng chống mối đe dọa (defensive strategy)',
  WO: 'khắc phục điểm yếu để nắm bắt cơ hội (improvement strategy)',
  WT: 'KHẨN CẤP — giải quyết điểm yếu + mối đe dọa trước khi quá muộn (survival strategy)',
}

function formatItems(label: string, items: SwotItem[]): string {
  if (items.length === 0) return ''
  const list = items.map((i, idx) => `${idx + 1}. ${i.statement}`).join('\n')
  return `${label}:\n${list}`
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as T
  } catch {
    console.error('[swot-strategy] JSON parse failed, using fallback')
    return fallback
  }
}

// ============================================================
// FUNCTION 1: generateCellStrategies
// ============================================================

export async function generateCellStrategies(
  cellType: ExtendedCellType,
  relevantStrengths: SwotItem[],
  relevantWeaknesses: SwotItem[],
  relevantOpportunities: SwotItem[],
  relevantThreats: SwotItem[],
  orgContext: OrgContext
): Promise<string[]> {
  const systemPrompt = `You are a Hoshin Kanri expert for Vietnamese SMEs. You use Extended SWOT Analysis (Melander method) to create specific, actionable strategic directions.

Key principles:
- Each strategic direction must be specific — not "improve service" but "Increase customer retention from X% to Y% by..."
- Strategic directions must lead to Hoshin (breakthrough objective), not daily tasks
- For ${cellType}: ${CELL_LABELS[cellType]}
- Prioritize high-impact and feasible within 90 days

Return ONLY a JSON array of 3 strings in Vietnamese, nothing else.`

  const parts: string[] = [
    `Tổ chức: ${orgContext.name}, ngành ${orgContext.industry}, ${orgContext.headcount} nhân viên`,
    '',
  ]

  if (cellType === 'SO') {
    parts.push(formatItems('Điểm mạnh cần tận dụng', relevantStrengths))
    parts.push(formatItems('Cơ hội cần khai thác', relevantOpportunities))
    parts.push('→ Tạo 3 SO strategies: dùng điểm mạnh để khai thác cơ hội')
  } else if (cellType === 'ST') {
    parts.push(formatItems('Điểm mạnh', relevantStrengths))
    parts.push(formatItems('Mối đe dọa', relevantThreats))
    parts.push('→ Tạo 3 ST strategies: dùng điểm mạnh để phòng chống mối đe dọa')
  } else if (cellType === 'WO') {
    parts.push(formatItems('Điểm yếu cần khắc phục', relevantWeaknesses))
    parts.push(formatItems('Cơ hội đang bị bỏ lỡ', relevantOpportunities))
    parts.push('→ Tạo 3 WO strategies: khắc phục điểm yếu để nắm bắt cơ hội')
  } else {
    parts.push(formatItems('Điểm yếu nguy hiểm', relevantWeaknesses))
    parts.push(formatItems('Mối đe dọa nghiêm trọng', relevantThreats))
    parts.push('→ Tạo 3 WT strategies: KHẨN CẤP — giải quyết trước khi quá muộn')
  }

  const fallback = [
    `${cellType} Strategy 1 — cần input cụ thể hơn`,
    `${cellType} Strategy 2 — cần input cụ thể hơn`,
    `${cellType} Strategy 3 — cần input cụ thể hơn`,
  ]

  try {
    const text = await callClaude(systemPrompt, parts.filter(Boolean).join('\n\n'))
    const parsed = parseJsonSafe<string[]>(text, fallback)
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every((s) => typeof s === 'string')) {
      return parsed.slice(0, 3)
    }
    return fallback
  } catch (err) {
    console.error(`[swot-strategy] generateCellStrategies ${cellType} error:`, err)
    // Retry once
    try {
      const text = await callClaude(systemPrompt, parts.filter(Boolean).join('\n\n'))
      return parseJsonSafe<string[]>(text, fallback).slice(0, 3)
    } catch {
      throw new Error(`Không thể tạo strategies cho ô ${cellType}`)
    }
  }
}

// ============================================================
// FUNCTION 2: synthesizeHoshinCandidates
// ============================================================

export async function synthesizeHoshinCandidates(
  selectedStrategies: { SO: string; ST: string; WO: string; WT: string },
  allSwotItems: SwotItem[],
  orgContext: OrgContext
): Promise<HoshinCandidate[]> {
  const systemPrompt = `You are a Hoshin Kanri expert. Your task is to distill 4 Extended SWOT strategies into 3-5 Hoshin Candidates for X-Matrix.

Hoshin principles (Kesterson/Melander):
- Each Hoshin must be a BREAKTHROUGH objective — not incremental improvement
- Maximum 5 Hoshins (fewer is better — focus is everything)
- Hoshin name ≤10 Vietnamese words, concise like a title
- WT strategies → priority 1-2 (urgent)
- SO strategies → priority 3-4 (growth)
- Each Hoshin must include 2-3 specific suggested KPIs with measurement units

Return ONLY valid JSON array, no markdown or explanation.`

  const itemsSummary = allSwotItems
    .map((i) => `[${i.category}] ${i.statement}`)
    .join('\n')

  const userPrompt = `4 selected strategies:
SO: ${selectedStrategies.SO}
ST: ${selectedStrategies.ST}
WO: ${selectedStrategies.WO}
WT: ${selectedStrategies.WT} ← XỬ LÝ TRƯỚC (highest priority)

SWOT items tham chiếu:
${itemsSummary}

Ngành: ${orgContext.industry} | Quy mô: ${orgContext.headcount} nhân viên

Tạo 3-5 HoshinCandidates theo JSON schema:
[{
  "id": "hoshin_1",
  "name": "string (≤10 từ tiếng Việt)",
  "description": "string (1-2 câu)",
  "sourceCellType": "SO" | "ST" | "WO" | "WT",
  "sourceItemIds": [],
  "priority": 1-5,
  "suggestedKpis": ["KPI cụ thể, có đơn vị"],
  "isSelectedForXMatrix": true
}]`

  try {
    const text = await callClaude(systemPrompt, userPrompt)
    const parsed = parseJsonSafe<HoshinCandidate[]>(text, [])

    if (!Array.isArray(parsed) || parsed.length < 3) {
      throw new Error('Không đủ candidates')
    }

    // Validate and normalize
    return parsed.slice(0, 5).map((c, idx) => ({
      id: c.id ?? `hoshin_${idx + 1}_${Date.now()}`,
      name: typeof c.name === 'string' ? c.name : `Hoshin ${idx + 1}`,
      description: typeof c.description === 'string' ? c.description : '',
      sourceCellType: (['SO', 'ST', 'WO', 'WT'] as const).includes(c.sourceCellType)
        ? c.sourceCellType
        : 'SO',
      sourceItemIds: Array.isArray(c.sourceItemIds) ? c.sourceItemIds : [],
      priority: ([1, 2, 3, 4, 5] as const).includes(c.priority) ? c.priority : ((idx + 1) as 1 | 2 | 3 | 4 | 5),
      suggestedKpis: Array.isArray(c.suggestedKpis) ? c.suggestedKpis : [],
      isSelectedForXMatrix: c.isSelectedForXMatrix !== false,
    }))
  } catch (err) {
    console.error('[swot-strategy] synthesizeHoshinCandidates error:', err)
    throw new Error('Không thể tạo Hoshin Candidates')
  }
}

// ============================================================
// FUNCTION 3: generateAllCells (convenience wrapper)
// ============================================================

export async function generateAllCells(
  synthesis: SwotSession['synthesis'],
  orgContext: OrgContext
): Promise<Record<ExtendedCellType, string[]>> {
  const s = synthesis.items.filter((i) => i.category === 'S')
  const w = synthesis.items.filter((i) => i.category === 'W')
  const o = synthesis.items.filter((i) => i.category === 'O')
  const t = synthesis.items.filter((i) => i.category === 'T')

  // WT first — most urgent per Melander
  const wtStrategies = await generateCellStrategies('WT', [], w, [], t, orgContext)

  // SO, ST, WO in parallel
  const [soStrategies, stStrategies, woStrategies] = await Promise.all([
    generateCellStrategies('SO', s, [], o, [], orgContext),
    generateCellStrategies('ST', s, [], [], t, orgContext),
    generateCellStrategies('WO', [], w, o, [], orgContext),
  ])

  return { SO: soStrategies, ST: stStrategies, WO: woStrategies, WT: wtStrategies }
}

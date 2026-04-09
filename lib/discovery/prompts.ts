import type { PainPoint } from './types'

export function getPainMapperPrompt(
  painPoints: PainPoint[],
  orgContext: { industry: string; city: string; orgName: string }
): string {
  const painList = painPoints.map((p, i) => `${i + 1}. ${p.text}`).join('\n')

  return `Bạn là chuyên gia Hoshin Kanri cho SME Việt Nam.

CEO của ${orgContext.orgName} (ngành ${orgContext.industry}, ${orgContext.city}) chia sẻ pain points:

${painList}

Chuyển đổi từng pain point thành Hoshin candidate (mục tiêu chiến lược 1 năm).
Hoshin = cụ thể, đo được, đạt được trong 1 năm. KHÔNG phải tầm nhìn. KHÔNG phải KPI.

Trả về JSON (không có text ngoài JSON):
{
  "candidates": [
    {
      "id": "hoshin_1",
      "hoshin": "[Mục tiêu, bắt đầu bằng động từ, 1 câu ngắn]",
      "rationale": "[Tại sao pain → hoshin này, 1–2 câu]",
      "painSource": "[Pain point gốc]",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Quy tắc:
- Mỗi pain → 1 hoshin. Merge nếu pain tương tự
- Hoshin phải đo được (có con số cụ thể)
- priority = high nếu ảnh hưởng trực tiếp đến doanh thu/sống còn
- Tối đa 5 candidates`
}

export function getVisionDraftPrompt(
  answers: Record<string, string>,
  orgContext: { industry: string; orgName: string; headcount: string }
): string {
  const answersList = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return `Bạn là chuyên gia tư vấn chiến lược. Draft Vision Statement và Year Goals.

Công ty: ${orgContext.orgName} | Ngành: ${orgContext.industry} | Quy mô: ${orgContext.headcount}

CEO trả lời:
${answersList}

Tạo:
1. Vision Statement: 1–2 câu, súc tích, truyền cảm hứng, KHÔNG sáo rỗng
2. Year Goals: 2–3 mục tiêu năm nay, cụ thể và đo được

Trả về JSON (không text ngoài JSON):
{
  "visionStatement": "[tiếng Việt]",
  "yearGoals": ["[Goal 1]", "[Goal 2]", "[Goal 3 nếu có]"],
  "timeframe": "3 năm"
}`
}

export function getSynthesisPrompt(
  orgContext: {
    orgName: string
    industry: string
    city: string
    headcount: string
  },
  swotItems: Array<{
    quadrant: string
    statement: string
    implication: string
    framework_source: string
  }>,
  hoshinCandidates: Array<{
    hoshin: string
    rationale: string
    priority: string
  }>,
  visionData: { finalVision: string; finalGoals: string[] },
  selectedKpis: Array<{
    name: string
    unit: string
    targetValue: number
    frequency: string
  }>
): string {
  const swotSummary = swotItems
    .map(
      (s) =>
        `[${s.quadrant}][${s.framework_source}] ${s.statement} → ${s.implication}`
    )
    .join('\n')

  const hoshinList = hoshinCandidates
    .map((h, i) => `${i + 1}. [${h.priority}] ${h.hoshin}`)
    .join('\n')

  const kpiList =
    selectedKpis.map((k) => `- ${k.name} (${k.unit}, ${k.frequency})`).join('\n') ||
    'Chưa có'

  return `Bạn là chuyên gia Hoshin Kanri. Tổng hợp Discovery data → X-Matrix pre-fill cho ${orgContext.orgName}.

=== VISION & GOALS ===
Vision: ${visionData.finalVision}
Year Goals: ${visionData.finalGoals.join(' | ')}

=== SWOT (${swotItems.length} items) ===
${swotSummary || 'Chưa có'}

=== HOSHIN CANDIDATES ===
${hoshinList || 'Chưa có'}

=== KPI GỢI Ý ===
${kpiList}

Quy tắc Hoshin Kanri:
- Tối đa 5 Hoshins
- Mỗi Hoshin: tối đa 3 Initiatives 90 ngày
- Mỗi Hoshin: tối đa 2 KPIs

Trả về JSON (không text ngoài JSON):
{
  "vision": "${visionData.finalVision}",
  "yearGoals": ${JSON.stringify(visionData.finalGoals)},
  "hoshinCandidates": [
    {
      "id": "hoshin_1",
      "title": "[max 8 từ]",
      "description": "[1–2 câu]",
      "sourceType": "pain",
      "swotLinks": ["[framework_source liên quan]"]
    }
  ],
  "initiatives": [
    {
      "id": "init_1",
      "hoshinId": "hoshin_1",
      "title": "[hành động cụ thể, bắt đầu bằng động từ]",
      "timeframe": "30d"
    }
  ],
  "kpiSuggestions": [
    {
      "hoshinId": "hoshin_1",
      "name": "[Tên KPI]",
      "unit": "[đơn vị]",
      "targetValue": 0,
      "frequency": "monthly",
      "dept_level": "company"
    }
  ],
  "generatedAt": "${new Date().toISOString()}",
  "discoveryCompleteness": 0,
  "warnings": []
}`
}

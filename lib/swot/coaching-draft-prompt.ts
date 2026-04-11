import type { SwotContextInput, SuggestMoreRequest, SwotDraft, SwotDraftItem } from './coaching-types'
import { QUADRANT_LABELS } from './coaching-types'

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích chiến lược doanh nghiệp Việt Nam với 20 năm kinh nghiệm.
Nhiệm vụ: Tạo bản SWOT analysis chất lượng cao cho doanh nghiệp SME Việt Nam.
QUAN TRỌNG: Chỉ trả về JSON, không giải thích thêm.`

export function getDraftSystemPrompt(): string {
  return SYSTEM_PROMPT
}

export function buildDraftUserPrompt(input: SwotContextInput): string {
  const frameworkBlocks: string[] = []
  const el = input.selectedElements

  if (el) {
    if (el.eightMs.length > 0) {
      frameworkBlocks.push(`→ Phân tích theo các yếu tố 8Ms: ${el.eightMs.join(', ')}`)
    }
    if (el.fiveForces.length > 0) {
      frameworkBlocks.push(`→ Phân tích theo các yếu tố 5 Forces: ${el.fiveForces.join(', ')}`)
    }
    if (el.pestel.length > 0) {
      frameworkBlocks.push(`→ Phân tích theo các yếu tố PESTEL: ${el.pestel.join(', ')}`)
    }
  } else {
    // Fallback: legacy full-framework selection
    if (input.selectedFrameworks.includes('8Ms')) {
      frameworkBlocks.push(
        '→ Phân tích qua 8 nguồn lực: Nhân lực, Máy móc, Nguyên liệu, Phương pháp, Tài chính, Đo lường, Quản lý, Môi trường làm việc (8Ms)'
      )
    }
    if (input.selectedFrameworks.includes('5Forces')) {
      frameworkBlocks.push(
        "→ Phân tích qua 5 áp lực: Đối thủ hiện tại, Khách hàng, Nhà cung cấp, Sản phẩm thay thế, Đối thủ tiềm ẩn (5 Forces)"
      )
    }
    if (input.selectedFrameworks.includes('PESTEL')) {
      frameworkBlocks.push(
        '→ Phân tích qua 6 yếu tố vĩ mô: Chính trị, Kinh tế, Xã hội, Công nghệ, Môi trường, Pháp lý (PESTEL)'
      )
    }
  }

  return `Doanh nghiệp: ${input.orgName}
Ngành: ${input.industry}
Quy mô: ${input.headcount} nhân sự, tại ${input.city}
Thách thức hiện tại: ${input.topChallenges}
Điểm mạnh hiện có: ${input.currentStrengths}
Mục tiêu 12 tháng: ${input.breakthroughGoal}

Góc nhìn phân tích được chọn:
${frameworkBlocks.join('\n')}

Hãy tạo SWOT analysis với cấu trúc JSON sau (KHÔNG thêm markdown/backtick):
{
  "strengths": [
    { "statement": "...", "rationale": "...", "frameworkSource": "8Ms", "confidence": "high" }
  ],
  "weaknesses": [...],
  "opportunities": [...],
  "threats": [...]
}

Yêu cầu:
- Mỗi quadrant: 3-5 items
- statement: câu hoàn chỉnh, tiếng Việt, cụ thể với ngành ${input.industry}
- rationale: 1 câu giải thích ngắn tại sao đây là điểm đáng chú ý
- frameworkSource: tên framework tạo ra insight này (8Ms | 5Forces | PESTEL)
- confidence: dựa trên mức độ thông tin được cung cấp
- KHÔNG bịa số liệu cụ thể nếu không có trong context
- Ưu tiên insights thực tế với bối cảnh SME Việt Nam`
}

export function buildSuggestMorePrompt(req: SuggestMoreRequest): string {
  const quadrantLabel = QUADRANT_LABELS[req.quadrant]
  const hintSection = req.hint.trim()
    ? `Hướng tập trung: ${req.hint}`
    : 'Không có hướng cụ thể — hãy đề xuất những góc nhìn còn thiếu.'

  const existingSection = req.existingItems.length > 0
    ? `Items đã có (KHÔNG lặp lại ý tương tự):\n${req.existingItems.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    : 'Chưa có items nào.'

  return `Bối cảnh doanh nghiệp:
- Công ty: ${req.contextInput.orgName} | Ngành: ${req.contextInput.industry}
- Quy mô: ${req.contextInput.headcount} | Thành phố: ${req.contextInput.city}
- Thách thức: ${req.contextInput.topChallenges}
- Điểm mạnh hiện tại: ${req.contextInput.currentStrengths}
- Mục tiêu 12 tháng: ${req.contextInput.breakthroughGoal}
- Frameworks đã dùng: ${req.contextInput.selectedFrameworks.join(', ')}

Nhiệm vụ: Gợi thêm items cho quadrant "${quadrantLabel}".
${hintSection}

${existingSection}

Trả về JSON (chỉ JSON, không markdown):
{
  "items": [
    {
      "statement": "...",
      "rationale": "...",
      "frameworkSource": "8Ms" | "5Forces" | "PESTEL",
      "confidence": "high" | "medium" | "low"
    }
  ]
}

Yêu cầu:
- Trả về đúng 2-3 items
- statement: tiếng Việt, cụ thể với ngành ${req.contextInput.industry}
- KHÔNG trùng ý với items đã có ở trên
- Ưu tiên góc nhìn mới, bổ sung cho list hiện tại
- KHÔNG bịa số liệu không có trong context`
}

export function buildConflictCheckPrompt(draft: SwotDraft): string {
  const fmt = (items: SwotDraftItem[]) =>
    items.map((item) => `  [${item.id}] ${item.statement}`).join('\n')

  return `Bạn là chuyên gia kiểm tra chất lượng SWOT analysis.
Nhiệm vụ: Tìm vấn đề logic trong bản SWOT dưới đây.

SWOT ANALYSIS:
STRENGTHS (Điểm mạnh):
${fmt(draft.strengths)}

WEAKNESSES (Điểm yếu):
${fmt(draft.weaknesses)}

OPPORTUNITIES (Cơ hội):
${fmt(draft.opportunities)}

THREATS (Thách thức):
${fmt(draft.threats)}

Tìm 2 loại vấn đề:
1. CONTRADICTION: Item trong Strengths mâu thuẫn trực tiếp với item trong Weaknesses, hoặc item trong Opportunities mâu thuẫn với item trong Threats.
2. DUPLICATE: 2 items trong CÙNG quadrant nói cùng ý theo cách khác nhau.

Chỉ báo cáo vấn đề RÕ RÀNG, không báo những điểm chỉ hơi tương tự.
Nếu không có vấn đề → trả về issues: [].

Trả về JSON (chỉ JSON, không markdown):
{
  "issues": [
    {
      "type": "contradiction" | "duplicate",
      "affectedItems": [
        { "quadrant": "strengths", "itemId": "..." },
        { "quadrant": "weaknesses", "itemId": "..." }
      ],
      "explanation": "giải thích ngắn tiếng Việt",
      "severity": "warning" | "info"
    }
  ]
}`
}

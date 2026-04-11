import type { SwotQuadrant } from '@/lib/swot/types'
import type { AiTowsGenerationRequest } from '@/lib/swot/tows-types'
import { TOWS_CONFIG } from '@/lib/swot/tows-types'

/**
 * Build a Vietnamese prompt for AI TOWS strategy generation.
 * All data is dynamic from the request — no hardcoded company/industry names.
 */
export function buildTowsPrompt(req: AiTowsGenerationRequest): string {
  const config = TOWS_CONFIG[req.quadrant]

  const swList = req.sw_factors
    .map((f) => {
      const ev = f.evidence_text ? ` (Bằng chứng: ${f.evidence_text})` : ''
      return `- [${f.code}] ${f.content}${ev}`
    })
    .join('\n')

  const otList = req.ot_factors
    .map((f) => {
      const ev = f.evidence_text ? ` (Bằng chứng: ${f.evidence_text})` : ''
      return `- [${f.code}] ${f.content}${ev}`
    })
    .join('\n')

  const bscHint =
    req.quadrant === 'SO' || req.quadrant === 'ST'
      ? 'finance hoặc customer'
      : 'process hoặc learning'

  return `Bạn là chuyên gia tư vấn chiến lược. Hãy tạo chiến lược ${config.desc} (${config.full}) cho doanh nghiệp.

BỐI CẢNH DOANH NGHIỆP:
- Ngành: ${req.org_context.industry}
- Quy mô: ${req.org_context.headcount} nhân sự
- Khu vực: ${req.org_context.city}

YẾU TỐ ${config.swQuadrant === 'S' ? 'ĐIỂM MẠNH' : 'ĐIỂM YẾU'}:
${swList}

YẾU TỐ ${config.otQuadrant === 'O' ? 'CƠ HỘI' : 'ĐE DỌA'}:
${otList}

YÊU CẦU:
- Tạo 2-3 chiến lược kết hợp các yếu tố trên
- Mỗi chiến lược phải actionable, bắt đầu bằng động từ, 2-3 câu
- Phù hợp quy mô ${req.org_context.headcount} nhân sự
- Gợi ý BSC perspective phù hợp (ưu tiên ${bscHint})

Trả lời CHÍNH XÁC dạng JSON array, không có text nào khác:
[{ "strategy_title": "Tên ngắn gọn", "strategy_statement": "Mô tả chiến lược 2-3 câu", "bsc_perspective": "finance|customer|process|learning" }]`
}

/**
 * Build a quality check prompt for a single SWOT factor.
 * Generic — no company/industry references.
 */
export function buildQualityCheckPrompt(
  content: string,
  quadrant: SwotQuadrant,
): string {
  const quadrantLabel: Record<SwotQuadrant, string> = {
    S: 'Điểm mạnh',
    W: 'Điểm yếu',
    O: 'Cơ hội',
    T: 'Đe dọa',
  }

  return `Đánh giá chất lượng yếu tố SWOT sau (${quadrantLabel[quadrant]}):

"${content}"

Tiêu chí đánh giá:
1. Tính cụ thể: có nêu rõ ai/cái gì/ở đâu không?
2. Tính đo lường được: có số liệu hoặc có thể đo lường không?
3. Tính liên quan: có phải yếu tố ${quadrantLabel[quadrant].toLowerCase()} thực sự không?

Trả lời CHÍNH XÁC dạng JSON, không có text nào khác:
{ "score": <1-5>, "feedback": "Nhận xét ngắn gọn", "improved": "Phiên bản cải thiện" }

Nếu yếu tố đã tốt (score >= 4), trả improved = null.`
}

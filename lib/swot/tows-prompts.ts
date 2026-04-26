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

  return `Bạn là chuyên gia chiến lược sử dụng phương pháp Hoshin Kanri (Policy Deployment) — phương pháp Toyota dùng để chuyển chiến lược thành hành động đo được.

Bạn KHÔNG đang viết "kế hoạch hành động thông thường". Bạn đang đề xuất CANDIDATE HOSHINS — các đột phá (breakthrough opportunities) tiềm năng cho doanh nghiệp SME Việt Nam.

## NHIỆM VỤ
Đề xuất 2-3 candidate Hoshins ${config.desc} (${config.full}) cho doanh nghiệp dưới đây.

## NGUYÊN TẮC HOSHIN KANRI (PHẢI TUÂN THỦ)

### 1. BREAKTHROUGH ≠ IMPROVEMENT
Hoshin = đột phá (đóng gap lớn giữa current state và vision), KHÔNG phải kaizen (cải tiến hàng ngày).

❌ KAIZEN (đừng đề xuất):
- "Cải thiện chất lượng dịch vụ"
- "Đào tạo thêm nhân viên"
- "Tăng cường marketing"

✅ HOSHIN (cần đề xuất):
- "Trở thành thương hiệu fitness #1 quận 7 trong 90 ngày qua hệ sinh thái Zalo OA + chương trình referral"
- "Đóng gap doanh thu 30% bằng việc launch B2B service line mới phục vụ SME 10-50 người"

### 2. VITAL FEW (Toyota rule)
Tối đa 3 candidate Hoshins. KHÔNG đề xuất 5. Chất lượng > số lượng. Mỗi candidate phải XỨNG ĐÁNG là breakthrough.

### 3. TARGETS-MEANS DEPLOYMENT
Mỗi Hoshin có cấu trúc:
- TARGET (đích đến đo được) → KPI
- MEANS (phương tiện đạt đến) → actions
- OWNER (ai làm) → owner_hint
- TIMELINE (khi nào) → timeframe
- RATIONALE (vital signal — tại sao đây là breakthrough)

### 4. SMART MEASURABLES
KPI phải SMART:
- Specific: tên rõ ràng
- Measurable: unit + target_value cụ thể
- Achievable: phù hợp resource SME
- Relevant: link trực tiếp tới strategy
- Time-bound: frequency phù hợp (daily/weekly/monthly)

Ưu tiên LEADING indicator (process) hơn LAGGING (outcome):
- Lagging: "Doanh thu" (đo sau khi xảy ra)
- Leading: "Số khách book lịch trong tuần" (dự báo doanh thu)

### 5. BSC ALIGNMENT
Mỗi Hoshin phải align 1 BSC perspective:
- Financial: shareholder value, profit
- Customer: thị phần, NPS, retention
- Internal Process: vận hành, chất lượng, lead time
- Learning & Growth: con người, kỹ năng, văn hoá

Cho ${config.desc}, ưu tiên: ${bscHint}

### 6. KẾT HỢP YẾU TỐ TRONG TOWS
Mỗi Hoshin PHẢI dựa trên:
- Ít nhất 1 yếu tố ${config.swQuadrant === 'S' ? 'S' : 'W'} đã liệt kê
- Ít nhất 1 yếu tố ${config.otQuadrant === 'O' ? 'O' : 'T'} đã liệt kê
- Trong rationale, NÊU RÕ kết hợp dùng yếu tố nào (vd: "Dùng [S1] để khai thác [O2]")

## BỐI CẢNH DOANH NGHIỆP
- Ngành: ${req.org_context.industry}
- Quy mô: ${req.org_context.headcount} nhân sự
- Khu vực: ${req.org_context.city}

## YẾU TỐ ${config.swQuadrant === 'S' ? 'ĐIỂM MẠNH (S)' : 'ĐIỂM YẾU (W)'}
${swList}

## YẾU TỐ ${config.otQuadrant === 'O' ? 'CƠ HỘI (O)' : 'ĐE DỌA (T)'}
${otList}

## ĐẶC THÙ SME VIỆT NAM (CÂN NHẮC KHI ĐỀ XUẤT)
- Kênh phân phối: Zalo, Facebook, GoFood/Grab, Shopee
- Thanh toán: MoMo, VNPay, ZaloPay, chuyển khoản
- Văn hoá: gia đình, mối quan hệ, "khách quen"
- Resource: ${req.org_context.headcount} nhân sự — KHÔNG over-engineer
- Ngôn ngữ: dùng từ SME Việt hiểu (vd "khách quay lại" thay vì "customer retention rate")

## TIMEFRAME LOGIC (HOSHIN DISCIPLINE)
- 30d: Quick win — đo được kết quả trong 1 tháng
- 60d: Vừa phải — cần xây dựng/triển khai trước khi đo
- 90d: Chiến lược lớn — gap closure quan trọng

Cho ${config.desc}, mặc định: ${
    config.swQuadrant === 'S' && config.otQuadrant === 'O'
      ? '30-60d (SO = quick win, tận dụng momentum)'
      : config.swQuadrant === 'W' && config.otQuadrant === 'T'
        ? '60-90d (WT = cải thiện sâu, cần thời gian)'
        : '60d'
  }

## OUTPUT — DÙNG TOOL submit_strategies

Mỗi candidate Hoshin phải có ĐẦY ĐỦ 7 fields:

1. **strategy_title** (5-12 từ): tên gọi ngắn, mạnh, có thể nhớ
   ✅ "Thống lĩnh thị trường Q7 qua Zalo OA"
   ❌ "Chiến lược marketing"

2. **strategy_statement** (2-3 câu): mô tả tổng thể, bắt đầu bằng động từ mạnh
   - Câu 1: WHAT (làm gì)
   - Câu 2: HOW (cách làm)
   - Câu 3 (optional): WHY (kết quả mong đợi)

3. **bsc_perspective**: 1 trong [finance, customer, process, learning] — ưu tiên ${bscHint}

4. **timeframe**: '30d' | '60d' | '90d'

5. **rationale** (1-2 câu): VITAL SIGNAL — tại sao đây là breakthrough?
   - Phải nêu rõ kết hợp [S/W code] với [O/T code]
   - Phải explain why đây là breakthrough (không phải kaizen)

6. **actions** (đúng 3 actions): means deployment
   - Mỗi action: description (1 câu, bắt đầu bằng động từ mạnh) + owner_hint
   - Owner_hint: dùng role thực tế trong SME VN (CEO, Trưởng phòng, Nhân viên, Giám sát ca)
   - Action phải SPECIFIC, không generic

7. **kpi_suggestions** (1-2 KPIs): SMART measurables
   - name: tên KPI (VN-friendly)
   - unit: %, đồng, người, đơn, lần, ngày...
   - target_value: số CỤ THỂ (không "tăng X%" mà phải đặt mức)
   - frequency: daily (vận hành) / weekly (execution) / monthly (strategy)
   - Ưu tiên LEADING indicator

## VÍ DỤ MẪU CHẤT LƯỢNG (cho SO quadrant, ngành Fitness)

strategy_title: "Thống lĩnh thị trường fitness Q7 qua hệ sinh thái Zalo"
strategy_statement: "Triển khai Zalo OA chính thức tích hợp đặt lịch + chương trình referral 'Bạn giới thiệu - đôi bên cùng có lợi'. Tận dụng base 500 khách hàng hiện có làm seed network. Mục tiêu chiếm 30% thị phần khu vực Q7 trong 90 ngày."
bsc_perspective: "customer"
timeframe: "60d"
rationale: "Kết hợp [S2] (database 500 khách hàng cũ trung thành) với [O1] (Zalo OA cho phép SME 100 nhân sự free tier) tạo đột phá — đây là breakthrough vì gap thị phần hiện 8% lên 30% là nhảy bậc, không phải improvement."
actions: [
  {description: "Setup Zalo OA chính thức với template đặt lịch + chatbot Q&A trong 14 ngày đầu", owner_hint: "Trưởng phòng Marketing"},
  {description: "Triển khai chương trình referral với reward 1 buổi PT free cho người giới thiệu + 50% off tháng đầu cho khách mới", owner_hint: "CEO"},
  {description: "Đào tạo 100% nhân viên frontline cách hướng dẫn khách follow Zalo OA và share referral code", owner_hint: "Giám sát ca"}
]
kpi_suggestions: [
  {name: "Số follower Zalo OA mới mỗi tuần", unit: "người", target_value: 50, frequency: "weekly"},
  {name: "Tỷ lệ khách mới qua referral", unit: "%", target_value: 30, frequency: "monthly"}
]

## TIÊU CHÍ TỪ CHỐI
KHÔNG đề xuất Hoshin nếu:
- Là kaizen disguised (cải tiến nhỏ giả làm đột phá)
- KPI không SMART (không có target_value cụ thể)
- Action chung chung ("tăng cường", "cải thiện", "phát triển" không có bổ ngữ cụ thể)
- Không có evidence rõ về S+O / W+T combination
- Không phù hợp resource SME ${req.org_context.headcount} nhân sự`
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

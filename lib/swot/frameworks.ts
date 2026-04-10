import type { EightMId, PorterId, PestelId, CoachingQuestion } from './types'

export interface FrameworkDimension {
  id: EightMId | PorterId | PestelId
  name: string
  nameEn: string
  description: string
  coachingPromptHint: string
}

export const EIGHT_MS: FrameworkDimension[] = [
  {
    id: 'M1_Man',
    name: 'Nhân lực',
    nameEn: 'Man',
    description: 'Năng lực, kinh nghiệm, và sự ổn định của đội ngũ',
    coachingPromptHint: 'Hỏi về chất lượng đội ngũ, tỷ lệ giữ chân nhân viên',
  },
  {
    id: 'M2_Machine',
    name: 'Máy móc & Công nghệ',
    nameEn: 'Machine',
    description: 'Hệ thống, công cụ, thiết bị, và công nghệ đang dùng',
    coachingPromptHint: 'Hỏi về công nghệ, phần mềm, tự động hóa hiện có',
  },
  {
    id: 'M3_Material',
    name: 'Nguyên vật liệu & Đầu vào',
    nameEn: 'Material',
    description: 'Chất lượng và độ ổn định của đầu vào, chuỗi cung ứng',
    coachingPromptHint: 'Hỏi về nhà cung cấp, rủi ro chuỗi cung ứng',
  },
  {
    id: 'M4_Method',
    name: 'Phương pháp & Quy trình',
    nameEn: 'Method',
    description: 'Quy trình làm việc, SOP, và cách thức vận hành',
    coachingPromptHint: 'Hỏi về quy trình cốt lõi, SOP, hiệu quả thực thi',
  },
  {
    id: 'M5_Measurement',
    name: 'Đo lường & KPI',
    nameEn: 'Measurement',
    description: 'Hệ thống đo lường hiệu quả và ra quyết định dựa trên dữ liệu',
    coachingPromptHint: 'Hỏi về KPI đang track, data-driven decisions',
  },
  {
    id: 'M6_Nature',
    name: 'Môi trường',
    nameEn: 'Mother Nature',
    description: 'Yếu tố địa lý, thời tiết, môi trường tác động đến hoạt động',
    coachingPromptHint: 'Hỏi về yếu tố địa lý, thời tiết ảnh hưởng đến vận hành',
  },
  {
    id: 'M7_Management',
    name: 'Quản lý & Lãnh đạo',
    nameEn: 'Management',
    description: 'Năng lực lãnh đạo, văn hóa tổ chức, và ra quyết định',
    coachingPromptHint: 'Hỏi về phong cách lãnh đạo, văn hóa, tốc độ ra quyết định',
  },
  {
    id: 'M8_Money',
    name: 'Tài chính',
    nameEn: 'Money',
    description: 'Sức khỏe tài chính, dòng tiền, và khả năng đầu tư',
    coachingPromptHint: 'Hỏi về dòng tiền, tỷ suất lợi nhuận, khả năng đầu tư',
  },
]

export const PORTER_FORCES: FrameworkDimension[] = [
  {
    id: 'Porter_P1',
    name: 'Cạnh tranh trong ngành',
    nameEn: 'Competitive Rivalry',
    description: 'Mức độ cạnh tranh với đối thủ hiện tại',
    coachingPromptHint: 'Hỏi về đối thủ chính, lợi thế cạnh tranh',
  },
  {
    id: 'Porter_P2',
    name: 'Sức mạnh nhà cung cấp',
    nameEn: 'Supplier Power',
    description: 'Khả năng nhà cung cấp tăng giá hoặc giảm chất lượng',
    coachingPromptHint: 'Hỏi về phụ thuộc nhà cung cấp, rủi ro tăng giá',
  },
  {
    id: 'Porter_P3',
    name: 'Sức mạnh khách hàng',
    nameEn: 'Buyer Power',
    description: 'Khả năng khách hàng đàm phán hoặc chuyển sang đối thủ',
    coachingPromptHint: 'Hỏi về tập trung khách hàng, switching cost',
  },
  {
    id: 'Porter_P4',
    name: 'Nguy cơ sản phẩm thay thế',
    nameEn: 'Threat of Substitutes',
    description: 'Rủi ro từ sản phẩm/dịch vụ khác thay thế',
    coachingPromptHint: 'Hỏi về công nghệ mới, xu hướng thay thế',
  },
  {
    id: 'Porter_P5',
    name: 'Nguy cơ đối thủ mới',
    nameEn: 'Threat of New Entrants',
    description: 'Rào cản gia nhập và khả năng có thêm đối thủ mới',
    coachingPromptHint: 'Hỏi về rào cản gia nhập, đối thủ tiềm năng',
  },
]

export const PESTEL_FACTORS: FrameworkDimension[] = [
  {
    id: 'PESTEL_P',
    name: 'Chính trị & Chính sách',
    nameEn: 'Political',
    description: 'Chính sách nhà nước, quy định ngành',
    coachingPromptHint: 'Hỏi về chính sách hỗ trợ/hạn chế ngành',
  },
  {
    id: 'PESTEL_E',
    name: 'Kinh tế vĩ mô',
    nameEn: 'Economic',
    description: 'Lãi suất, lạm phát, GDP, sức mua',
    coachingPromptHint: 'Hỏi về tác động lạm phát, xu hướng sức chi tiêu',
  },
  {
    id: 'PESTEL_S',
    name: 'Xã hội & Nhân khẩu',
    nameEn: 'Social',
    description: 'Xu hướng xã hội, thay đổi hành vi tiêu dùng',
    coachingPromptHint: 'Hỏi về thay đổi hành vi khách hàng mục tiêu',
  },
  {
    id: 'PESTEL_T',
    name: 'Công nghệ',
    nameEn: 'Technological',
    description: 'Đổi mới công nghệ, AI, tự động hóa',
    coachingPromptHint: 'Hỏi về công nghệ mới nổi, cơ hội từ AI',
  },
  {
    id: 'PESTEL_En',
    name: 'Môi trường & ESG',
    nameEn: 'Environmental',
    description: 'Quy định môi trường, xu hướng xanh',
    coachingPromptHint: 'Hỏi về áp lực ESG, cơ hội từ xu hướng xanh',
  },
  {
    id: 'PESTEL_L',
    name: 'Pháp lý',
    nameEn: 'Legal',
    description: 'Luật lao động, bảo vệ dữ liệu, quy định ngành',
    coachingPromptHint: 'Hỏi về thay đổi pháp lý sắp tới',
  },
]

// ============================================================
// Question Bank — user-facing, no framework jargon
// ============================================================

export const COACHING_QUESTION_BANK: CoachingQuestion[] = [
  // --- Strengths / Weaknesses (Internal) ---
  {
    id: 'q_team',
    text: 'Đội ngũ hiện tại của bạn — điểm mạnh lớn nhất và điểm yếu rõ nhất là gì?',
    follow_up_prompt: 'Bạn có thể kể cụ thể hơn về trường hợp nào cho thấy điểm đó không?',
    framework_source: '8M:Man',
    swot_target: 'S',
    dimension_key: 'team_capability',
  },
  {
    id: 'q_process',
    text: 'Quy trình vận hành nào đang chạy tốt nhất? Quy trình nào thường xuyên gây ra vấn đề?',
    framework_source: '8M:Method',
    swot_target: 'W',
    dimension_key: 'operations',
  },
  {
    id: 'q_cashflow',
    text: 'Tình hình dòng tiền 6 tháng gần nhất như thế nào? Có tháng nào bạn lo ngại không?',
    framework_source: '8M:Money',
    swot_target: 'W',
    dimension_key: 'finance',
  },
  {
    id: 'q_product',
    text: 'Sản phẩm/dịch vụ nào đang tạo ra nhiều doanh thu nhất? Tại sao khách hàng chọn bạn thay vì đối thủ?',
    framework_source: '8M:Material',
    swot_target: 'S',
    dimension_key: 'product_strength',
  },
  {
    id: 'q_management',
    text: 'Quyết định chiến lược lớn nhất bạn đã đưa ra trong 12 tháng qua là gì? Kết quả ra sao?',
    framework_source: '8M:Management',
    swot_target: 'S',
    dimension_key: 'leadership',
  },
  // --- Opportunities / Threats (External) ---
  {
    id: 'q_competitor',
    text: 'Đối thủ trực tiếp lớn nhất của bạn là ai? Họ đang làm gì mà bạn chưa làm được?',
    framework_source: 'Porter:Rivalry',
    swot_target: 'T',
    dimension_key: 'competition',
  },
  {
    id: 'q_new_entrants',
    text: 'Trong 1-2 năm tới, bạn thấy ai có thể vào ngành này cạnh tranh với bạn?',
    framework_source: 'Porter:NewEntrants',
    swot_target: 'T',
    dimension_key: 'market_entry_risk',
  },
  {
    id: 'q_customer_trend',
    text: 'Nhu cầu của khách hàng đang thay đổi như thế nào? Có xu hướng nào bạn chưa đáp ứng được?',
    framework_source: 'PESTEL:Social',
    swot_target: 'O',
    dimension_key: 'customer_trend',
  },
  {
    id: 'q_technology',
    text: 'Có công nghệ hay công cụ nào bạn biết đang thay đổi ngành của mình không? Bạn đang phản ứng thế nào?',
    framework_source: 'PESTEL:Technological',
    swot_target: 'O',
    dimension_key: 'tech_opportunity',
  },
  {
    id: 'q_regulation',
    text: 'Có chính sách hay quy định nào sắp thay đổi có thể ảnh hưởng đến hoạt động của bạn không?',
    framework_source: 'PESTEL:Legal',
    swot_target: 'T',
    dimension_key: 'regulatory_risk',
  },
]

export const REQUIRED_DIMENSIONS = [
  'team_capability',
  'operations',
  'finance',
  'competition',
  'customer_trend',
]

export const MIN_COVERAGE_TO_ADVANCE = 7

/** User-facing labels for dimension pills — no framework jargon */
export const DIMENSION_LABELS: Record<string, string> = {
  // 8M dimensions
  Man: 'Đội ngũ',
  Machine: 'Công nghệ',
  Material: 'Sản phẩm',
  Method: 'Vận hành',
  Measurement: 'Đo lường',
  'Mother Nature': 'Môi trường',
  Management: 'Lãnh đạo',
  Money: 'Tài chính',
  // Porter dimensions
  'Competitive Rivalry': 'Cạnh tranh',
  'Supplier Power': 'Nhà cung cấp',
  'Buyer Power': 'Khách hàng',
  'Threat of Substitutes': 'Sản phẩm thay thế',
  'Threat of New Entrants': 'Đối thủ mới',
  // PESTEL dimensions
  Political: 'Chính sách',
  Economic: 'Kinh tế',
  Social: 'Xu hướng XH',
  Technological: 'Công nghệ',
  Environmental: 'Môi trường',
  Legal: 'Pháp lý',
}

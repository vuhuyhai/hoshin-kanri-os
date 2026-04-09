import type { EightMId, PorterId, PestelId } from './types'

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

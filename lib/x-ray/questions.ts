import type { OpexPillar, XRayQuestion } from './types'

export interface PillarMeta {
  label: string
  icon: string
  description: string
}

export const OPEX_PILLARS: Record<OpexPillar, PillarMeta> = {
  lean: {
    label: 'Tinh gọn vận hành',
    icon: '⚡',
    description: 'Loại bỏ lãng phí, tối ưu quy trình',
  },
  six_sigma: {
    label: 'Chất lượng & Ổn định',
    icon: '🎯',
    description: 'Giảm sai lỗi, tăng độ tin cậy',
  },
  workplace: {
    label: 'Môi trường làm việc',
    icon: '🏆',
    description: 'Văn hóa, đội ngũ, hiệu suất',
  },
  value_chain: {
    label: 'Chuỗi giá trị',
    icon: '🔗',
    description: 'Từ nhà cung cấp đến khách hàng',
  },
  cx: {
    label: 'Trải nghiệm khách hàng',
    icon: '💎',
    description: 'Sự hài lòng và gắn bó',
  },
  value_innovation: {
    label: 'Đổi mới & Khác biệt',
    icon: '🚀',
    description: 'Tạo ra giá trị mới, dẫn đầu thị trường',
  },
  value_ai: {
    label: 'Ứng dụng AI',
    icon: '🤖',
    description: 'AI tạo giá trị thực tế',
  },
}

export const PILLAR_ORDER: OpexPillar[] = [
  'lean',
  'six_sigma',
  'workplace',
  'value_chain',
  'cx',
  'value_innovation',
  'value_ai',
]

export const X_RAY_QUESTIONS: XRayQuestion[] = [
  // ═══ TRỤ CỘT 1: LEAN MANAGEMENT ═══
  {
    id: 'lean_1',
    pillar: 'lean',
    question:
      'Nhân viên của bạn mất bao nhiêu thời gian vào các việc không tạo ra giá trị trực tiếp cho khách hàng?',
    helpText:
      'Ví dụ: họp không cần thiết, chờ đợi phê duyệt, xử lý lại công việc bị lỗi, tìm kiếm thông tin...',
    options: [
      { value: 1, label: 'Hơn 50% thời gian — cảm giác bận nhưng không hiệu quả' },
      { value: 2, label: '30-50% thời gian — khá nhiều việc không đáng' },
      { value: 3, label: '15-30% thời gian — có lãng phí nhưng không quá nghiêm trọng' },
      { value: 4, label: 'Dưới 15% — quy trình khá gọn gàng' },
    ],
  },
  {
    id: 'lean_2',
    pillar: 'lean',
    question:
      'Khi có vấn đề xảy ra trong vận hành, nhóm của bạn thường xử lý như thế nào?',
    helpText:
      'Phản ứng với sự cố cho thấy mức độ trưởng thành trong quản lý quy trình của doanh nghiệp.',
    options: [
      { value: 1, label: 'Chữa cháy — ai biết thì làm, không có quy trình rõ ràng' },
      { value: 2, label: 'Có người xử lý nhưng mỗi lần một kiểu, hay tái diễn' },
      { value: 3, label: 'Có quy trình cơ bản nhưng chưa ngăn được tái diễn' },
      { value: 4, label: 'Phân tích nguyên nhân gốc, giải quyết triệt để, ít tái diễn' },
    ],
  },
  {
    id: 'lean_3',
    pillar: 'lean',
    question:
      'Quy trình làm việc chính của doanh nghiệp bạn được ghi chép và chuẩn hóa ở mức độ nào?',
    helpText:
      'Chuẩn hóa quy trình giúp doanh nghiệp không phụ thuộc vào "người biết việc" và dễ dàng đào tạo người mới.',
    options: [
      { value: 1, label: 'Không có — mọi thứ nằm trong đầu từng người' },
      { value: 2, label: 'Có vài tài liệu nhưng lỗi thời và không ai dùng' },
      { value: 3, label: 'Có quy trình viết ra nhưng chưa được tuân thủ đồng đều' },
      { value: 4, label: 'Có SOP đầy đủ, cập nhật thường xuyên và đội ngũ tuân thủ' },
    ],
  },

  // ═══ TRỤ CỘT 2: SIX SIGMA ═══
  {
    id: 'sigma_1',
    pillar: 'six_sigma',
    question:
      'Tỉ lệ sai lỗi, phải làm lại hoặc khiếu nại trong sản phẩm/dịch vụ của bạn hiện tại là bao nhiêu?',
    helpText:
      'Sai lỗi không chỉ gây lãng phí chi phí mà còn làm mất niềm tin của khách hàng.',
    options: [
      { value: 1, label: 'Rất cao — khiếu nại thường xuyên, làm lại liên tục' },
      { value: 2, label: 'Đáng lo — mỗi tháng đều có sự cố đáng kể' },
      { value: 3, label: 'Ở mức chấp nhận được — thỉnh thoảng có nhưng không nghiêm trọng' },
      { value: 4, label: 'Rất thấp — gần như không có sai lỗi đáng kể' },
    ],
  },
  {
    id: 'sigma_2',
    pillar: 'six_sigma',
    question:
      'Doanh nghiệp bạn đưa ra quyết định kinh doanh dựa trên dữ liệu hay cảm tính?',
    helpText:
      'Doanh nghiệp dùng dữ liệu để quyết định thường ít mắc sai lầm tốn kém hơn.',
    options: [
      { value: 1, label: 'Chủ yếu cảm tính và kinh nghiệm cá nhân' },
      { value: 2, label: 'Có dữ liệu nhưng ít khi dùng để quyết định' },
      { value: 3, label: 'Dùng dữ liệu cho một số quyết định quan trọng' },
      { value: 4, label: 'Mọi quyết định quan trọng đều có dữ liệu hỗ trợ' },
    ],
  },
  {
    id: 'sigma_3',
    pillar: 'six_sigma',
    question:
      'Chất lượng sản phẩm/dịch vụ của bạn có nhất quán giữa các lần cung cấp không?',
    helpText:
      'Khách hàng quay lại khi họ biết chắc mình sẽ nhận được trải nghiệm tốt như lần trước.',
    options: [
      { value: 1, label: 'Không ổn định — lần tốt lần xấu, khách hàng không biết trước được' },
      { value: 2, label: 'Khá thất thường — phụ thuộc vào ai làm hôm đó' },
      { value: 3, label: 'Tương đối ổn định nhưng đôi khi vẫn có biến động' },
      { value: 4, label: 'Rất nhất quán — khách hàng luôn nhận được chất lượng như kỳ vọng' },
    ],
  },

  // ═══ TRỤ CỘT 3: HIGH PERFORMANCE WORKPLACE ═══
  {
    id: 'workplace_1',
    pillar: 'workplace',
    question:
      'Tỉ lệ nhân viên nghỉ việc tự nguyện trong 12 tháng qua của bạn là bao nhiêu?',
    helpText:
      'Nghỉ việc cao thường là dấu hiệu của vấn đề văn hóa, lãnh đạo hoặc cơ hội phát triển.',
    options: [
      { value: 1, label: 'Trên 40% — gần như không giữ được người' },
      { value: 2, label: '20-40% — khá cao, ảnh hưởng đến vận hành' },
      { value: 3, label: '10-20% — mức trung bình ngành' },
      { value: 4, label: 'Dưới 10% — đội ngũ gắn bó, ổn định' },
    ],
  },
  {
    id: 'workplace_2',
    pillar: 'workplace',
    question:
      'Nhân viên của bạn hiểu rõ mục tiêu của công ty và vai trò của họ đóng góp vào mục tiêu đó ở mức nào?',
    helpText:
      'Khi nhân viên hiểu "tại sao", họ làm việc chủ động và có trách nhiệm hơn.',
    options: [
      { value: 1, label: 'Hầu như không — nhân viên chỉ biết việc của mình' },
      { value: 2, label: 'Một số người biết nhưng không đồng đều' },
      { value: 3, label: 'Phần lớn hiểu nhưng chưa thực sự gắn kết' },
      { value: 4, label: 'Toàn bộ đội ngũ hiểu rõ và chủ động đóng góp' },
    ],
  },
  {
    id: 'workplace_3',
    pillar: 'workplace',
    question:
      'Doanh nghiệp của bạn có lộ trình phát triển rõ ràng cho nhân viên không?',
    helpText:
      'Người tài ở lại khi họ thấy tương lai của mình ở công ty.',
    options: [
      { value: 1, label: 'Không có — thăng tiến theo cảm tính hoặc may mắn' },
      { value: 2, label: 'Có ý tưởng nhưng chưa thành hệ thống rõ ràng' },
      { value: 3, label: 'Có lộ trình cho vị trí chủ chốt nhưng chưa phủ toàn bộ' },
      { value: 4, label: 'Có lộ trình rõ ràng cho mọi vị trí, được review định kỳ' },
    ],
  },

  // ═══ TRỤ CỘT 4: VALUE CHAIN ═══
  {
    id: 'chain_1',
    pillar: 'value_chain',
    question:
      'Mức độ phụ thuộc của bạn vào một nhà cung cấp hoặc đối tác duy nhất là như thế nào?',
    helpText:
      'Phụ thuộc quá nhiều vào một nguồn cung là rủi ro lớn khi họ gặp vấn đề hoặc tăng giá.',
    options: [
      { value: 1, label: 'Phụ thuộc hoàn toàn — không có phương án thay thế' },
      { value: 2, label: 'Phụ thuộc nhiều — có thay thế nhưng rất khó' },
      { value: 3, label: 'Có 2-3 lựa chọn nhưng chưa đa dạng đủ' },
      { value: 4, label: 'Chuỗi cung ứng đa dạng, chủ động và ổn định' },
    ],
  },
  {
    id: 'chain_2',
    pillar: 'value_chain',
    question:
      'Thời gian từ khi nhận đơn hàng đến khi khách hàng nhận được sản phẩm/dịch vụ của bạn so với đối thủ?',
    helpText:
      'Tốc độ giao hàng là lợi thế cạnh tranh ngày càng quan trọng.',
    options: [
      { value: 1, label: 'Chậm hơn đối thủ đáng kể — khách hàng hay phàn nàn' },
      { value: 2, label: 'Tương đương nhưng không ổn định' },
      { value: 3, label: 'Tương đương hoặc nhanh hơn một chút' },
      { value: 4, label: 'Nhanh hơn rõ rệt — đây là điểm mạnh của chúng tôi' },
    ],
  },
  {
    id: 'chain_3',
    pillar: 'value_chain',
    question:
      'Bạn có thể nhìn thấy toàn bộ trạng thái đơn hàng/dự án đang xử lý theo thời gian thực không?',
    helpText:
      'Khả năng nhìn thấy toàn bộ chuỗi giúp phát hiện tắc nghẽn sớm trước khi ảnh hưởng đến khách hàng.',
    options: [
      { value: 1, label: 'Không — phải hỏi từng người mới biết' },
      { value: 2, label: 'Có nhưng thủ công, mất thời gian tổng hợp' },
      { value: 3, label: 'Có dashboard cơ bản nhưng chưa đầy đủ' },
      { value: 4, label: 'Nhìn thấy toàn bộ real-time, cảnh báo tự động khi trễ' },
    ],
  },

  // ═══ TRỤ CỘT 5: CUSTOMER EXPERIENCE ═══
  {
    id: 'cx_1',
    pillar: 'cx',
    question:
      'Tỉ lệ khách hàng quay lại mua lần 2 trở lên trong 6 tháng qua của bạn là bao nhiêu?',
    helpText:
      'Khách hàng quay lại là chỉ số quan trọng nhất của trải nghiệm tốt — quan trọng hơn lời khen.',
    options: [
      { value: 1, label: 'Dưới 20% — gần như chỉ bán được 1 lần' },
      { value: 2, label: '20-40% — mức thấp, cần cải thiện nhiều' },
      { value: 3, label: '40-60% — trung bình, có cơ sở để phát triển' },
      { value: 4, label: 'Trên 60% — khách hàng trung thành là nền tảng của chúng tôi' },
    ],
  },
  {
    id: 'cx_2',
    pillar: 'cx',
    question:
      'Khi khách hàng gặp vấn đề hoặc khiếu nại, bạn giải quyết trong bao lâu?',
    helpText:
      'Cách xử lý khiếu nại quyết định liệu khách hàng có ở lại hay không — thậm chí trở thành người ủng hộ.',
    options: [
      { value: 1, label: 'Hơn 3 ngày hoặc nhiều khi không giải quyết được' },
      { value: 2, label: '1-3 ngày, đôi khi bị quên hoặc trễ' },
      { value: 3, label: 'Trong vòng 24 giờ với quy trình rõ ràng' },
      { value: 4, label: 'Trong vài giờ, có hệ thống theo dõi, khách hàng được cập nhật liên tục' },
    ],
  },
  {
    id: 'cx_3',
    pillar: 'cx',
    question:
      'Bạn có thực sự hiểu lý do tại sao khách hàng rời bỏ doanh nghiệp không?',
    helpText:
      'Doanh nghiệp phát triển bền vững biết chính xác mình đang mất khách hàng vì lý do gì.',
    options: [
      { value: 1, label: 'Không biết — chỉ nhận ra khi họ đã đi rồi' },
      { value: 2, label: 'Đoán được nhưng chưa có dữ liệu xác nhận' },
      { value: 3, label: 'Có khảo sát định kỳ nhưng chưa hành động nhiều' },
      { value: 4, label: 'Theo dõi chặt chẽ, phân tích nguyên nhân và có action plan rõ ràng' },
    ],
  },

  // ═══ TRỤ CỘT 6: VALUE INNOVATION ═══
  {
    id: 'innovation_1',
    pillar: 'value_innovation',
    question:
      'Điều gì làm cho khách hàng chọn bạn thay vì đối thủ cùng phân khúc?',
    helpText:
      'Sự khác biệt rõ ràng là nền tảng để doanh nghiệp không bị cuốn vào cuộc chiến giá.',
    options: [
      { value: 1, label: 'Giá rẻ hơn — không có lý do khác đặc biệt' },
      { value: 2, label: 'Quen biết hoặc tiện lợi địa điểm — dễ bị thay thế' },
      { value: 3, label: 'Chất lượng hoặc dịch vụ tốt hơn một chút' },
      { value: 4, label: 'Có giá trị độc đáo rõ ràng mà đối thủ khó sao chép' },
    ],
  },
  {
    id: 'innovation_2',
    pillar: 'value_innovation',
    question:
      'Lần cuối cùng doanh nghiệp bạn tung ra sản phẩm/dịch vụ hoặc cách làm hoàn toàn mới là khi nào?',
    helpText:
      'Đổi mới liên tục giúp doanh nghiệp không bị thị trường bỏ lại phía sau.',
    options: [
      { value: 1, label: 'Hơn 3 năm trước — gần như không thay đổi gì' },
      { value: 2, label: '1-3 năm trước — cải tiến nhỏ nhưng chưa có gì đột phá' },
      { value: 3, label: 'Trong 12 tháng qua — có cải tiến đáng kể' },
      { value: 4, label: 'Liên tục — đổi mới là một phần văn hóa của chúng tôi' },
    ],
  },
  {
    id: 'innovation_3',
    pillar: 'value_innovation',
    question:
      'Doanh nghiệp bạn có hệ thống thu thập và thử nghiệm ý tưởng mới từ nhân viên và khách hàng không?',
    helpText:
      'Ý tưởng tốt nhất thường đến từ người trực tiếp làm việc với khách hàng mỗi ngày.',
    options: [
      { value: 1, label: 'Không có — ý tưởng chỉ đến từ ban lãnh đạo' },
      { value: 2, label: 'Có nhưng không chính thức, ý tưởng hay bị bỏ qua' },
      { value: 3, label: 'Có kênh nhưng ít ý tưởng được thử nghiệm thực sự' },
      { value: 4, label: 'Có hệ thống rõ ràng — ý tưởng được đánh giá và thử nghiệm nhanh' },
    ],
  },

  // ═══ TRỤ CỘT 7: VALUE AI ═══
  {
    id: 'ai_1',
    pillar: 'value_ai',
    question:
      'Hiện tại AI và tự động hóa đang hỗ trợ bao nhiêu % công việc lặp lại trong doanh nghiệp bạn?',
    helpText:
      'Công việc lặp lại (báo cáo, nhập liệu, trả lời câu hỏi thường gặp...) là cơ hội tiết kiệm thời gian rõ ràng nhất.',
    options: [
      { value: 1, label: 'Gần như không — vẫn làm thủ công hoàn toàn' },
      { value: 2, label: 'Dưới 20% — mới bắt đầu thử một vài công cụ' },
      { value: 3, label: '20-50% — đang ứng dụng nhưng chưa có hệ thống' },
      { value: 4, label: 'Trên 50% — AI và automation là một phần vận hành' },
    ],
  },
  {
    id: 'ai_2',
    pillar: 'value_ai',
    question:
      'Đội ngũ của bạn đang dùng AI để hỗ trợ công việc hàng ngày ở mức độ nào?',
    helpText:
      'AI thực sự tạo giá trị khi nhân viên biết cách dùng đúng chỗ — không phải cứ mua tool về là xong.',
    options: [
      { value: 1, label: 'Hầu như không ai dùng — thiếu kiến thức và định hướng' },
      { value: 2, label: 'Một vài người tự dùng ChatGPT nhưng không có hướng dẫn' },
      { value: 3, label: 'Có đào tạo cơ bản, một số team đang áp dụng' },
      { value: 4, label: 'Có chiến lược AI rõ ràng, đội ngũ được đào tạo và đang tạo ra kết quả đo được' },
    ],
  },
  {
    id: 'ai_3',
    pillar: 'value_ai',
    question:
      'Bạn có đo lường được AI và tự động hóa đang tiết kiệm bao nhiêu thời gian/chi phí không?',
    helpText:
      'Nếu không đo được, không biết AI đang thực sự giúp ích hay chỉ tốn tiền mua tool.',
    options: [
      { value: 1, label: 'Không đo — không biết có hiệu quả không' },
      { value: 2, label: 'Cảm giác có hiệu quả nhưng không có số liệu' },
      { value: 3, label: 'Đo được một số chỉ số nhưng chưa đầy đủ' },
      { value: 4, label: 'Có dashboard rõ ràng, biết chính xác ROI của từng ứng dụng AI' },
    ],
  },
]

export function getQuestionsForPillar(pillar: OpexPillar): XRayQuestion[] {
  return X_RAY_QUESTIONS.filter((q) => q.pillar === pillar)
}

export function getAllQuestions(): XRayQuestion[] {
  return X_RAY_QUESTIONS
}

// Scoring: 3 questions per pillar, each 1-4 -> max 12 per pillar
// Convert to 0-100: (rawScore / 12) * 100
export function calculatePillarScore(answers: number[]): number {
  const raw = answers.reduce((sum, v) => sum + v, 0)
  return Math.round((raw / 12) * 100)
}

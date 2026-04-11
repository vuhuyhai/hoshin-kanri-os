export interface GuideDetail {
  text: string
  subItems?: string[]
}

export interface GuideStepData {
  icon: string
  title: string
  description: string
  details: GuideDetail[]
  tip: string
}

export const GUIDE_STEPS: GuideStepData[] = [
  {
    icon: '🔍',
    title: 'Chọn góc nhìn phân tích',
    description: 'Xác định framework AI sẽ dùng để khai thác SWOT của bạn',
    details: [
      {
        text: 'Nhóm SW (Điểm mạnh & Yếu): Chọn yếu tố từ 8Ms',
        subItems: [
          '8Ms gồm: Nhân lực, Máy móc, Nguyên liệu, Phương pháp, Tài chính, Đo lường, Quản lý, Môi trường làm việc',
          'Chọn ít nhất 1 yếu tố để tiếp tục',
        ],
      },
      {
        text: 'Nhóm OT (Cơ hội & Thách thức): Chọn từ 5 Forces HOẶC PESTEL',
        subItems: [
          '5 Forces: Đối thủ hiện tại, Khách hàng, Nhà cung cấp, Sản phẩm thay thế, Đối thủ tiềm ẩn',
          'PESTEL: Chính trị, Kinh tế, Xã hội, Công nghệ, Môi trường, Pháp lý',
        ],
      },
    ],
    tip: 'Chọn càng cụ thể, AI phân tích càng sâu',
  },
  {
    icon: '💬',
    title: 'Trả lời câu hỏi dẫn dắt',
    description: 'AI đặt câu hỏi để hiểu bối cảnh doanh nghiệp của bạn',
    details: [
      { text: 'AI sẽ hỏi 4–6 câu dựa trên framework bạn chọn' },
      { text: 'Trả lời càng cụ thể càng tốt — không cần hoàn hảo' },
      { text: 'Có thể bỏ qua câu không liên quan (nhấn "Bỏ qua")' },
      { text: 'Câu trả lời chỉ dùng trong phiên này, không lưu công khai' },
    ],
    tip: 'Đừng lo về văn phong — AI hiểu ngôn ngữ tự nhiên',
  },
  {
    icon: '🔎',
    title: 'Xem xét bằng chứng thực tế',
    description: 'AI tìm kiếm dữ liệu thị trường để bổ sung luận cứ',
    details: [
      { text: 'AI tự động tìm kiếm thông tin ngành từ các nguồn uy tín' },
      { text: 'Mỗi bằng chứng có nhãn: Nguồn + Mức độ liên quan' },
      { text: 'Bạn có thể: Chấp nhận ✓ / Bỏ qua ✗ / Thêm thủ công +' },
      { text: 'Bằng chứng được chấp nhận sẽ đưa vào phân tích cuối' },
    ],
    tip: 'Ưu tiên bằng chứng có dữ liệu số cụ thể',
  },
  {
    icon: '⚡',
    title: 'Xem kết quả phân tích SWOT',
    description: 'AI tổng hợp thành ma trận SWOT đầy đủ 4 góc phần tư',
    details: [
      { text: 'S — Strengths: Điểm mạnh nội tại (từ 8Ms bạn chọn)' },
      { text: 'W — Weaknesses: Điểm yếu cần cải thiện' },
      { text: 'O — Opportunities: Cơ hội từ môi trường bên ngoài' },
      { text: 'T — Threats: Thách thức và rủi ro tiềm ẩn' },
      { text: 'Mỗi góc có 3–5 luận điểm, kèm bằng chứng hỗ trợ' },
      { text: 'Có thể chỉnh sửa, thêm, xóa từng luận điểm' },
    ],
    tip: 'Nhấn vào từng luận điểm để xem chi tiết và nguồn',
  },
  {
    icon: '🎯',
    title: 'Tổng hợp thành chiến lược',
    description: 'AI đề xuất hướng chiến lược từ kết quả SWOT',
    details: [
      { text: 'SO Strategy: Dùng Strengths để khai thác Opportunities' },
      { text: 'ST Strategy: Dùng Strengths để né tránh Threats' },
      { text: 'WO Strategy: Khắc phục Weaknesses để tận dụng Opportunities' },
      { text: 'WT Strategy: Giảm thiểu Weaknesses và Threats' },
      { text: 'Có thể xuất kết quả sang X-Matrix để lập kế hoạch tiếp' },
    ],
    tip: 'Nhấn "Đưa vào X-Matrix" để chuyển sang bước lập kế hoạch',
  },
  {
    icon: '💾',
    title: 'Lưu và chia sẻ kết quả',
    description: 'Lưu phân tích và chia sẻ với team',
    details: [
      { text: 'Kết quả tự động lưu vào tổ chức của bạn' },
      { text: 'Có thể xem lại trong "Lịch sử phân tích"' },
      { text: 'Export PDF hoặc copy link chia sẻ nội bộ' },
      { text: 'Dùng kết quả để prefill X-Matrix Builder' },
    ],
    tip: 'SWOT nên được cập nhật mỗi quý hoặc khi có biến động lớn',
  },
]

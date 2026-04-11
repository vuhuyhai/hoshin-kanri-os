import { ADMIN_SECTION } from './help-data-admin'

export type HelpSectionId =
  | 'overview' | 'quickstart' | 'xray' | 'discovery'
  | 'xmatrix' | 'kpi' | 'report' | 'faq'
  | 'admin'

export interface HelpStep { text: string }

export interface HelpCard {
  title: string
  variant: 'default' | 'accent' | 'warning' | 'success'
  body: string
  steps?: HelpStep[]
}

export interface FaqItem { question: string; answer: string }

export interface HelpSection {
  id: HelpSectionId
  label: string
  icon: string
  title: string
  subtitle?: string
  cards: HelpCard[]
  faqs?: FaqItem[]
  superAdminOnly?: boolean
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'overview', label: 'Tổng quan', icon: 'LayoutDashboard',
    title: 'Tổng quan Hoshin Kanri OS',
    subtitle: 'Hiểu nhanh sản phẩm trong 2 phút',
    cards: [
      { title: 'Vấn đề cốt lõi', variant: 'accent',
        body: '90% SME có chiến lược đẹp trên giấy nhưng không triển khai được. Hoshin Kanri OS tạo sợi dây <strong>Tầm nhìn → Hoshin → KPI → Kết quả</strong>.' },
      { title: 'Luồng 6 bước', variant: 'default',
        body: '<strong>X-Ray</strong> → <strong>Discovery</strong> → <strong>X-Matrix</strong> → <strong>KPI Tracking</strong> → <strong>Báo cáo AI</strong> → <strong>Chia sẻ</strong>. Mỗi bước kế thừa dữ liệu từ bước trước, AI hỗ trợ xuyên suốt.' },
      { title: 'Vai trò trong hệ thống', variant: 'default',
        body: '<strong>CEO</strong> — toàn quyền: tạo X-Matrix, SWOT, quản lý KPI, quản lý tổ chức.<br/><strong>Manager</strong> — tạo KPI, nhập số liệu KPI.<br/><strong>Member</strong> — chỉ nhập KPI entries được giao.' },
    ],
  },
  {
    id: 'quickstart', label: 'Bắt đầu', icon: 'Rocket',
    title: 'Bắt đầu nhanh',
    subtitle: 'Đăng ký và thiết lập tổ chức',
    cards: [
      { title: 'Đăng ký tài khoản', variant: 'accent', body: 'Tạo tài khoản mới chỉ trong 30 giây.',
        steps: [
          { text: 'Nhập <strong>email</strong> và <strong>mật khẩu</strong>' },
          { text: 'Xác nhận email qua link trong hộp thư' },
          { text: 'Hoặc đăng nhập bằng <strong>Google OAuth</strong> (1 click)' },
        ] },
      { title: 'Thiết lập tổ chức (lần đầu)', variant: 'default', body: 'Sau khi đăng nhập lần đầu, hệ thống sẽ yêu cầu thiết lập tổ chức.',
        steps: [
          { text: 'Nhập <strong>tên doanh nghiệp</strong>' },
          { text: 'Chọn <strong>ngành nghề</strong>' },
          { text: 'Chọn <strong>quy mô nhân sự</strong> (1–10, 10–50, 50–200)' },
          { text: 'Nhập <strong>thành phố</strong>' },
        ] },
      { title: 'Được mời vào tổ chức', variant: 'success',
        body: 'Nhận email mời → click link → đăng ký hoặc đăng nhập → tự động được thêm vào tổ chức với role được chỉ định.' },
    ],
  },
  {
    id: 'xray', label: 'Business X-Ray', icon: 'ScanLine',
    title: 'Business X-Ray',
    subtitle: 'Chẩn đoán sức khỏe doanh nghiệp trong 5 phút',
    cards: [
      { title: 'Không cần đăng nhập', variant: 'accent',
        body: 'Truy cập <code>/x-ray</code> để bắt đầu. Trả lời <strong>15 câu hỏi</strong> theo <strong>5 chiều đánh giá</strong> (Leadership, Strategy, Customer, Operations, People). Nhận báo cáo ngay lập tức.' },
      { title: '4 mức kết quả', variant: 'default',
        body: '<strong>Strong</strong> (80–100 điểm) · <strong>Moderate</strong> (60–79) · <strong>Weak</strong> (40–59) · <strong>Critical</strong> (0–39). AI phân tích chi tiết từng chiều và đề xuất hành động.' },
      { title: 'Lưu lịch sử (đã đăng nhập)', variant: 'success',
        body: 'Nếu bạn đã đăng nhập, kết quả X-Ray sẽ tự động lưu vào lịch sử tại <code>/dashboard/discovery/xray-history</code>. So sánh điểm qua từng lần đánh giá.' },
    ],
  },
  {
    id: 'discovery', label: 'Discovery', icon: 'Compass',
    title: 'Discovery Hub',
    subtitle: 'Khám phá và phân tích doanh nghiệp toàn diện',
    cards: [
      { title: 'Thứ tự khuyến nghị', variant: 'warning',
        body: 'Để đạt kết quả tốt nhất, hãy thực hiện theo thứ tự: <strong>X-Ray → SWOT → Pain Mapper → Vision Workshop → AI Synthesis → X-Matrix</strong>. Mỗi bước cung cấp dữ liệu cho bước tiếp theo.' },
      { title: 'SWOT Analysis — 3 Phase', variant: 'default',
        body: '<strong>Phase 1 — AI Coaching:</strong> AI Coach hướng dẫn phân tích theo framework (8Ms, Porter, PESTEL). Tạo draft SWOT tự động.<br/><strong>Phase 2 — Evidence Search:</strong> Tavily tìm bằng chứng thị trường cho từng yếu tố.<br/><strong>Phase 3 — TOWS Matrix:</strong> AI tổng hợp S×O, W×O, S×T, W×T thành chiến lược cụ thể.' },
      { title: 'Pain Mapper + Vision Workshop', variant: 'default',
        body: '<strong>Pain Mapper:</strong> Liệt kê điểm đau → AI phân tích → tạo Hoshin candidates.<br/><strong>Vision Workshop:</strong> Trả lời 5–7 câu hỏi → AI tạo tuyên ngôn tầm nhìn cho tổ chức.' },
      { title: 'AI Synthesis', variant: 'accent',
        body: 'Tổng hợp toàn bộ dữ liệu Discovery (X-Ray + SWOT + Pain + Vision) → AI tạo bản nháp X-Matrix sẵn sàng để review và chỉnh sửa.' },
    ],
  },
  {
    id: 'xmatrix', label: 'X-Matrix ★', icon: 'Grid2x2',
    title: 'X-Matrix Builder',
    subtitle: 'Tính năng cốt lõi — kết nối Tầm nhìn → Hoshin → Sáng kiến → KPI → Owner',
    cards: [
      { title: 'Tính năng cốt lõi', variant: 'accent',
        body: 'X-Matrix là trái tim của Hoshin Kanri — kết nối <strong>Tầm nhìn → Hoshin → Sáng kiến → KPI → Owner</strong> trên một ma trận duy nhất. AI có thể prefill 70% từ Discovery data.' },
      { title: 'Bước 1–2: Tầm nhìn & Hoshin', variant: 'default',
        body: '<strong>Bước 1:</strong> Nhập Tầm nhìn và Mục tiêu năm (tối đa 3 mục tiêu).<br/><strong>Bước 2:</strong> Xác định Annual Hoshins — các đột phá chiến lược trong năm (tối đa 5).' },
      { title: 'Bước 3–4: Sáng kiến & KPI', variant: 'default',
        body: '<strong>Bước 3:</strong> Thêm Sáng kiến cho mỗi Hoshin (tối đa 3, timeline 30/60/90 ngày).<br/><strong>Bước 4:</strong> Gắn KPI cho mỗi Hoshin (tối đa 4, chỉ định owner cụ thể).' },
      { title: 'Bước 5 — Review & Lưu', variant: 'default',
        body: 'Kiểm tra tính nhất quán toàn bộ ma trận → Lưu bản nháp (draft) → Kích hoạt (active) → Chia sẻ qua link công khai.' },
      { title: 'Lưu ý về link chia sẻ', variant: 'warning',
        body: 'Title của X-Matrix được dùng làm slug cho link <code>/x/[title]</code>. <strong>KHÔNG</strong> tạo slug riêng — hãy đặt title bằng ký tự Latin không dấu để link hoạt động tốt nhất.' },
    ],
  },
  {
    id: 'kpi', label: 'KPI Tracking', icon: 'BarChart3',
    title: 'KPI Tracking',
    subtitle: 'Theo dõi và cập nhật KPI hàng tuần',
    cards: [
      { title: 'Hướng dẫn nhập KPI', variant: 'default', body: 'Cập nhật số liệu thực tế cho từng KPI được giao.',
        steps: [
          { text: 'Vào <strong>/dashboard/kpi</strong> từ sidebar' },
          { text: 'Tìm KPI được giao cho bạn (lọc theo owner)' },
          { text: 'Nhập <strong>Actual Value</strong> — số liệu thực tế' },
          { text: 'Chọn <strong>Period Date</strong> — ngày/tuần/tháng tương ứng' },
          { text: 'Nhấn <strong>Lưu</strong> — sparkline cập nhật ngay' },
        ] },
      { title: '3 màu trạng thái', variant: 'default',
        body: '🟢 <strong>Xanh</strong> — đạt ≥100% target<br/>🟡 <strong>Vàng</strong> — đạt 70–99% target<br/>🔴 <strong>Đỏ</strong> — dưới 70% target. Cần hành động ngay.' },
      { title: 'Checklist nhập đúng', variant: 'warning',
        body: 'Đảm bảo 4 điều khi nhập KPI:',
        steps: [
          { text: 'Chọn đúng <strong>period_date</strong> (không nhập nhầm kỳ)' },
          { text: 'Ghi <strong>note</strong> khi KPI đỏ — giải thích nguyên nhân' },
          { text: 'Nhập đúng <strong>tần suất</strong> (daily/weekly/monthly)' },
          { text: 'Không tạo <strong>entry trùng</strong> cho cùng kỳ' },
        ] },
    ],
  },
  {
    id: 'report', label: 'Báo cáo AI', icon: 'FileText',
    title: 'Báo cáo tháng AI',
    subtitle: 'AI tổng hợp hiệu suất KPI tự động',
    cards: [
      { title: 'AI phân tích tự động', variant: 'accent',
        body: 'AI phân tích toàn bộ KPI thực tế → tạo báo cáo với <strong>Wins</strong> (thành tựu), <strong>Risks</strong> (rủi ro), và <strong>Xu hướng</strong> theo từng Hoshin.' },
      { title: 'Cách sử dụng', variant: 'default', body: 'Tạo báo cáo tháng chỉ với vài click.',
        steps: [
          { text: 'Vào <strong>/dashboard/report</strong> từ sidebar' },
          { text: 'Nhấn <strong>Tạo báo cáo</strong>' },
          { text: 'Đợi 15–30 giây để AI xử lý' },
          { text: 'Đọc phân tích <strong>Wins / Risks / Xu hướng</strong>' },
          { text: 'Nhấn <strong>Xuất PDF</strong> để gửi ban lãnh đạo' },
        ] },
      { title: 'Lưu ý quan trọng', variant: 'warning',
        body: 'Không tạo báo cáo nhiều lần trong ngày — mỗi lần tạo tốn AI API credits. Tạo <strong>1 lần cuối tháng</strong> là đủ. Đảm bảo KPI đã được cập nhật đầy đủ trước khi tạo báo cáo.' },
    ],
  },
  {
    id: 'faq', label: 'Hỏi đáp', icon: 'HelpCircle',
    title: 'Câu hỏi thường gặp',
    cards: [],
    faqs: [
      { question: 'Mất phiên SWOT coaching giữa chừng?',
        answer: 'Phiên coaching <strong>tự động lưu mỗi 2 giây</strong>. Khi bạn quay lại trang SWOT, hệ thống sẽ hỏi có muốn tiếp tục phiên trước không.' },
      { question: 'Làm sao chuyển X-Matrix từ draft sang active?',
        answer: 'Vào chi tiết X-Matrix → nhấn nút <strong>Kích hoạt</strong> → trạng thái chuyển từ draft sang active. Chỉ có thể có 1 X-Matrix active tại một thời điểm.' },
      { question: 'Thêm thành viên vào tổ chức?',
        answer: 'Vào <strong>Settings → Quản lý thành viên → Nhập email → Chọn role (CEO/Manager/Member) → Gửi lời mời</strong>. Thành viên nhận email và tự đăng ký.' },
      { question: 'AI Synthesis báo lỗi?',
        answer: 'Kiểm tra <strong>SWOT Phase 1</strong> đã hoàn thành chưa (cần ít nhất vài yếu tố S/W/O/T). Reload trang và thử lại. Nếu vẫn lỗi, liên hệ support.' },
      { question: 'Link chia sẻ X-Matrix không hoạt động?',
        answer: 'Title X-Matrix chứa dấu cách hoặc ký tự đặc biệt có thể gây lỗi URL. <strong>Đổi tên title bằng ký tự Latin không dấu</strong> (VD: "chien-luoc-2026").' },
      { question: 'KPI đỏ liên tục có ảnh hưởng gì?',
        answer: 'Hệ thống PQL engine tự động phát hiện KPI đỏ ≥2 tuần liên tiếp và <strong>gửi email alert cho founder</strong> để kịp thời can thiệp và hỗ trợ.' },
      { question: 'Thay đổi ngành/quy mô sau onboarding?',
        answer: 'Vào <strong>Settings → Thông tin tổ chức</strong> → chỉnh sửa ngành nghề, quy mô nhân sự → nhấn <strong>Lưu</strong>.' },
      { question: 'Bật/tắt Dark mode?',
        answer: 'Toggle ở header (góc phải). Cài đặt lưu trong localStorage (key <code>hoshin-theme-v2</code>). Mặc định là light mode.' },
    ],
  },
  ADMIN_SECTION,
]

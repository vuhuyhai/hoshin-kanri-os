import type { HelpSection } from './help-data'

export const ADMIN_SECTION: HelpSection = {
  id: 'admin',
  label: 'Admin Panel',
  icon: 'Shield',
  title: 'Admin Panel — Quản trị hệ thống',
  subtitle: 'Chỉ dành cho Super Admin. Không hiển thị với người dùng thông thường.',
  superAdminOnly: true,
  faqs: [],
  cards: [
    {
      title: 'Truy cập Admin Panel', variant: 'warning',
      body: 'Admin Panel là khu vực riêng biệt tại <code>/admin</code> — hoàn toàn tách khỏi dashboard người dùng. Chỉ tài khoản có <code>profiles.is_super_admin = true</code> mới được phép vào. Truy cập sai URL sẽ bị redirect về <code>/dashboard</code>.',
      steps: [
        { text: 'Truy cập <code>/admin/login</code> — trang đăng nhập riêng cho admin' },
        { text: 'Nhập email + password tài khoản super admin → hệ thống gọi <code>POST /api/admin/verify</code> xác thực' },
        { text: 'Nếu <code>is_super_admin = true</code> → redirect vào <code>/admin</code> dashboard' },
        { text: 'Mọi request đến <code>/admin/*</code> đều được middleware kiểm tra lại qua service role client' },
      ],
    },
    {
      title: 'Dashboard tổng quan', variant: 'default',
      body: 'Trang chủ <code>/admin</code> hiển thị danh sách tất cả organizations trong hệ thống qua view <code>admin_customers_overview</code>.',
      steps: [
        { text: '<strong>Tên org + ngành nghề</strong> — thông tin cơ bản từ bảng <code>organizations</code>' },
        { text: '<strong>Owner</strong> — email người đăng ký đầu tiên của org' },
        { text: '<strong>Plan Tier</strong> — free / starter / growth / enterprise (hiển thị qua <code>PlanBadge</code> component)' },
        { text: '<strong>Member count</strong> — số thành viên trong org' },
        { text: '<strong>CustomerFilter</strong> — lọc theo plan tier, tìm kiếm theo tên org hoặc email' },
      ],
    },
    {
      title: 'Chi tiết khách hàng', variant: 'default',
      body: 'Nhấn vào một org → vào <code>/admin/customers/[id]</code>. Trang này dùng view <code>admin_customer_detail</code> để lấy đầy đủ thông tin.',
      steps: [
        { text: '<strong>Thông tin org</strong> — tên, ngành, headcount, thành phố, ngày tạo' },
        { text: '<strong>Subscription</strong> — plan hiện tại, trạng thái (active / trialing / past_due / canceled), ngày hết hạn' },
        { text: '<strong>Metrics</strong> — số X-Matrix, số KPI, số SWOT analyses, lần cuối hoạt động' },
        { text: '<strong>Danh sách thành viên</strong> — email + vai trò (CEO / Manager / Member)' },
      ],
    },
    {
      title: 'Đổi Plan Tier', variant: 'accent',
      body: 'Dùng component <code>ChangePlanForm</code> tại trang detail khách hàng. Form gọi Server Action trong <code>app/admin/_actions.ts</code>.',
      steps: [
        { text: 'Chọn plan mới từ dropdown: <code>free</code> / <code>starter</code> / <code>growth</code> / <code>enterprise</code>' },
        { text: 'Nhấn <strong>Cập nhật Plan</strong> → Server Action cập nhật bảng <code>subscriptions</code> bằng admin client (bypass RLS)' },
        { text: 'Thay đổi có hiệu lực ngay — không cần restart hay re-deploy' },
        { text: '<strong>Lưu ý:</strong> Stripe billing chưa tích hợp — đổi plan ở đây chỉ thay đổi trong DB, không charge thẻ' },
      ],
    },
    {
      title: 'Admin Notes', variant: 'default',
      body: 'Ghi chú nội bộ per-org qua component <code>AdminNotesSection</code>. Notes lưu vào bảng <code>admin_notes</code> và <strong>không bao giờ hiển thị với người dùng</strong>.',
      steps: [
        { text: 'Tại trang detail org → cuộn xuống phần <strong>Ghi chú Admin</strong>' },
        { text: 'Nhập ghi chú → nhấn <strong>Thêm ghi chú</strong> → gọi Server Action lưu vào <code>admin_notes</code>' },
        { text: 'Dùng để ghi log cuộc gọi tư vấn, lý do đổi plan, các vấn đề cần theo dõi' },
        { text: 'Ghi chú hiển thị theo thứ tự mới nhất trước, có timestamp' },
      ],
    },
    {
      title: 'PQL Engine — Cảnh báo tự động', variant: 'accent',
      body: 'PQL (Product-Qualified Lead) Engine tự động gửi email cảnh báo khi phát hiện org có tín hiệu cần tư vấn. Logic nằm trong <code>lib/pql/signals.ts</code>, kích hoạt qua <code>GET /api/pql/check</code>.',
      steps: [
        { text: '<strong>Điều kiện kích hoạt đồng thời:</strong> Org hoạt động ≥ 3 tuần (weekly unique dates) <strong>VÀ</strong> có ≥ 2 thành viên <strong>VÀ</strong> có ≥ 1 KPI đỏ liên tục 2+ tuần' },
        { text: 'Khi đủ điều kiện → gửi email PQL alert đến founder qua <strong>Resend</strong> (template trong <code>lib/email/templates.ts</code>)' },
        { text: 'Log gửi email được lưu vào bảng <code>notification_logs</code> với <code>type = \'email\'</code>' },
        { text: '<strong>Kiểm tra thủ công:</strong> Gọi <code>GET /api/pql/check</code> từ Postman hoặc trình duyệt (cần auth) để trigger ngay' },
      ],
    },
    {
      title: 'Database Views quan trọng', variant: 'default',
      body: 'Admin Panel dùng 2 PostgreSQL views được tạo trong migration 010. Không sửa trực tiếp — chỉ đọc.',
      steps: [
        { text: '<code>admin_customers_overview</code> — Quick list: org info + owner email + plan + member count. Dùng cho trang danh sách <code>/admin/customers</code>' },
        { text: '<code>admin_customer_detail</code> — Full detail: tất cả thông tin org + metrics hoạt động + subscription. Dùng cho <code>/admin/customers/[id]</code>' },
        { text: 'Cả 2 view đều query qua <strong>admin client</strong> (<code>lib/supabase/admin.ts</code>) — dùng service role key, bypass RLS' },
        { text: '<strong>Lưu ý bảo mật:</strong> Không bao giờ expose admin client xuống browser hay API public' },
      ],
    },
  ],
}

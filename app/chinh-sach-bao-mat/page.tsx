import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật — Hoshin Kanri OS',
  description: 'Chính sách bảo mật dữ liệu của Hoshin Kanri OS — tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.',
}

export default function ChinhSachBaoMatPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-bg-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link href="/" aria-label="Trang chủ Hoshin Kanri OS" className="flex items-center gap-2">
            <Image src="/images/logo-light.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
            <span className="font-display font-black text-sm uppercase tracking-wider">Hoshin Kanri OS</span>
          </Link>
          <nav aria-label="Menu chính" className="flex items-center gap-3">
            <Link
              href="/x-ray"
              className="hidden font-display text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-accent-brand md:inline-block"
            >
              Business X-Ray
            </Link>
            <Link href="/login">
              <span className="btn-brutal-secondary text-xs px-5 py-2.5 inline-block">
                Đăng nhập
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 bg-bg-warm">
        <div className="mx-auto max-w-[800px] px-6 py-16 lg:py-24">
          <p className="heading-overline mb-3">Pháp lý</p>
          <h1 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
            Chính sách bảo mật
          </h1>
          <p className="mt-4 font-body text-sm text-text-3">
            Có hiệu lực từ ngày 01 tháng 04 năm 2026 · Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
          </p>

          <div className="mt-10 space-y-8 font-body text-[17px] leading-[1.8] text-text-2">
            <p>
              Hoshin Kanri OS cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích rõ chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn như thế nào.
            </p>

            {/* 1. Thông tin thu thập */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">1. Thông tin chúng tôi thu thập</h2>

              <h3 className="mt-6 font-display text-base font-bold text-ink">1.1 Thông tin bạn cung cấp trực tiếp</h3>
              <ul className="mt-2 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Thông tin tài khoản:</strong> Tên, địa chỉ email, tên doanh nghiệp, số điện thoại (tùy chọn)</li>
                <li><strong className="text-ink">Hồ sơ tổ chức:</strong> Ngành nghề, quy mô nhân sự, địa bàn hoạt động</li>
                <li><strong className="text-ink">Nội dung chiến lược:</strong> SWOT, X-Matrix, mục tiêu, KPI và dữ liệu bạn nhập vào hệ thống</li>
              </ul>

              <h3 className="mt-6 font-display text-base font-bold text-ink">1.2 Thông tin thu thập tự động</h3>
              <ul className="mt-2 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Dữ liệu sử dụng:</strong> Tính năng bạn dùng, tần suất truy cập, thời gian phiên làm việc</li>
                <li><strong className="text-ink">Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, thiết bị</li>
                <li><strong className="text-ink">Cookie và công nghệ tương tự:</strong> Để duy trì phiên đăng nhập và cá nhân hóa trải nghiệm</li>
              </ul>

              <h3 className="mt-6 font-display text-base font-bold text-ink">1.3 Thông tin từ bên thứ ba</h3>
              <p className="mt-2">
                Nếu bạn đăng nhập qua liên kết trong email hoặc tương tác qua Zalo OA, chúng tôi có thể nhận thêm thông tin phù hợp từ các nền tảng đó.
              </p>
            </section>

            {/* 2. Mục đích sử dụng */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">2. Mục đích sử dụng thông tin</h2>
              <p className="mt-4">Chúng tôi sử dụng thông tin của bạn để:</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-2 border-ink text-left">
                  <thead>
                    <tr className="bg-bg-muted-warm">
                      <th className="border-2 border-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink">Mục đích</th>
                      <th className="border-2 border-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink">Cơ sở pháp lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Cung cấp và vận hành Dịch vụ', 'Thực hiện hợp đồng'],
                      ['Cá nhân hóa AI coaching và phân tích', 'Lợi ích hợp pháp'],
                      ['Gửi thông báo KPI, báo cáo định kỳ', 'Thực hiện hợp đồng'],
                      ['Cải thiện sản phẩm thông qua phân tích hành vi', 'Lợi ích hợp pháp'],
                      ['Gửi thông tin cập nhật, khuyến mãi', 'Sự đồng ý của bạn'],
                      ['Phát hiện và ngăn chặn gian lận', 'Tuân thủ pháp luật'],
                    ].map(([purpose, legal]) => (
                      <tr key={purpose} className="odd:bg-bg-warm even:bg-bg-muted-warm/50">
                        <td className="border-2 border-ink px-4 py-3">{purpose}</td>
                        <td className="border-2 border-ink px-4 py-3">{legal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Chia sẻ thông tin */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">3. Chia sẻ thông tin</h2>
              <p className="mt-4">
                Chúng tôi <strong className="text-ink">không bán dữ liệu cá nhân</strong> của bạn cho bất kỳ bên thứ ba nào.
              </p>
              <p className="mt-4">Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:</p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">3.1 Nhà cung cấp dịch vụ (Sub-processors)</h3>
              <p className="mt-2">Các đối tác hỗ trợ vận hành kỹ thuật, có ký thỏa thuận bảo mật dữ liệu:</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-2 border-ink text-left">
                  <thead>
                    <tr className="bg-bg-muted-warm">
                      <th className="border-2 border-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink">Nhà cung cấp</th>
                      <th className="border-2 border-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink">Mục đích</th>
                      <th className="border-2 border-ink px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink">Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Supabase', 'Lưu trữ dữ liệu, xác thực', 'Mỹ (AWS)'],
                      ['Anthropic', 'Xử lý AI (không lưu nội dung)', 'Mỹ'],
                      ['Vercel', 'Hosting ứng dụng', 'Mỹ (Edge)'],
                      ['PostHog', 'Phân tích sản phẩm (ẩn danh)', 'EU/Mỹ'],
                      ['Resend', 'Gửi email giao dịch', 'Mỹ'],
                      ['Tavily', 'Tìm kiếm bằng chứng thị trường', 'Mỹ'],
                    ].map(([provider, purpose, location]) => (
                      <tr key={provider} className="odd:bg-bg-warm even:bg-bg-muted-warm/50">
                        <td className="border-2 border-ink px-4 py-3 font-semibold text-ink">{provider}</td>
                        <td className="border-2 border-ink px-4 py-3">{purpose}</td>
                        <td className="border-2 border-ink px-4 py-3">{location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 font-display text-base font-bold text-ink">3.2 Yêu cầu pháp lý</h3>
              <p className="mt-2">
                Khi được yêu cầu bởi cơ quan có thẩm quyền theo đúng quy định pháp luật Việt Nam.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">3.3 Chuyển nhượng doanh nghiệp</h3>
              <p className="mt-2">
                Trong trường hợp sáp nhập hoặc mua lại, dữ liệu có thể được chuyển giao với thông báo trước cho người dùng.
              </p>
            </section>

            {/* 4. Bảo mật dữ liệu */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">4. Bảo mật dữ liệu</h2>
              <p className="mt-4">Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp:</p>
              <ul className="mt-4 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Mã hóa:</strong> Dữ liệu được mã hóa khi truyền (TLS 1.3) và khi lưu trữ (AES-256)</li>
                <li><strong className="text-ink">Kiểm soát truy cập:</strong> Row Level Security (RLS) — mỗi tổ chức chỉ xem dữ liệu của mình</li>
                <li><strong className="text-ink">Xác thực:</strong> Magic link OTP, không lưu mật khẩu dạng plaintext</li>
                <li><strong className="text-ink">Giám sát:</strong> Theo dõi hoạt động bất thường 24/7</li>
                <li><strong className="text-ink">Kiểm toán định kỳ:</strong> Rà soát bảo mật hàng quý</li>
              </ul>
            </section>

            {/* 5. Lưu trữ và xóa */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">5. Lưu trữ và xóa dữ liệu</h2>
              <ul className="mt-4 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Dữ liệu tài khoản:</strong> Được lưu trong suốt thời gian bạn sử dụng dịch vụ</li>
                <li><strong className="text-ink">Dữ liệu sau khi hủy:</strong> Được giữ 90 ngày để bạn có thể khôi phục, sau đó xóa vĩnh viễn</li>
                <li><strong className="text-ink">Log hệ thống:</strong> Xóa sau 12 tháng</li>
                <li><strong className="text-ink">Dữ liệu ẩn danh:</strong> Có thể được giữ vô thời hạn để cải thiện sản phẩm</li>
              </ul>
            </section>

            {/* 6. Quyền của bạn */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">6. Quyền của bạn</h2>
              <p className="mt-4">Theo Nghị định 13/2023/NĐ-CP, bạn có các quyền sau:</p>
              <ul className="mt-4 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Quyền truy cập:</strong> Yêu cầu bản sao dữ liệu cá nhân chúng tôi đang lưu trữ</li>
                <li><strong className="text-ink">Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác</li>
                <li><strong className="text-ink">Quyền xóa:</strong> Yêu cầu xóa dữ liệu cá nhân (trừ dữ liệu pháp lý bắt buộc lưu giữ)</li>
                <li><strong className="text-ink">Quyền phản đối:</strong> Phản đối việc xử lý dữ liệu cho mục đích tiếp thị</li>
                <li><strong className="text-ink">Quyền di chuyển dữ liệu:</strong> Nhận dữ liệu của bạn ở định dạng có thể đọc được (JSON/CSV)</li>
                <li><strong className="text-ink">Quyền rút lại đồng ý:</strong> Bất cứ lúc nào với các xử lý dựa trên sự đồng ý</li>
              </ul>
              <p className="mt-4">
                Để thực hiện các quyền trên, vui lòng gửi yêu cầu tới: <strong className="text-ink">privacy@chienluoc.org</strong>
              </p>
              <p className="mt-1">
                Chúng tôi sẽ phản hồi trong vòng <strong className="text-ink">15 ngày làm việc</strong>.
              </p>
            </section>

            {/* 7. Cookie */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">7. Cookie</h2>
              <p className="mt-4">Chúng tôi sử dụng cookie để:</p>
              <ul className="mt-4 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">Cookie thiết yếu:</strong> Duy trì phiên đăng nhập (không thể tắt)</li>
                <li><strong className="text-ink">Cookie phân tích:</strong> Hiểu cách bạn dùng sản phẩm (có thể tắt)</li>
                <li><strong className="text-ink">Cookie tùy chọn:</strong> Ghi nhớ cài đặt giao diện (có thể tắt)</li>
              </ul>
              <p className="mt-4">
                Bạn có thể quản lý cookie qua cài đặt trình duyệt hoặc banner cookie khi truy cập lần đầu.
              </p>
            </section>

            {/* 8. Trẻ em */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">8. Trẻ em</h2>
              <p className="mt-4">
                Dịch vụ không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em.
              </p>
            </section>

            {/* 9. Thay đổi chính sách */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">9. Thay đổi chính sách</h2>
              <p className="mt-4">
                Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email đăng ký và hiển thị thông báo rõ ràng tại đầu trang này.
              </p>
            </section>

            {/* 10. Liên hệ */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">10. Liên hệ về bảo mật</h2>
              <p className="mt-4"><strong className="text-ink">Bộ phận bảo vệ dữ liệu:</strong></p>
              <p className="mt-2">
                <strong className="text-ink">privacy@chienluoc.org</strong>
              </p>
              <p className="mt-4">
                Nếu bạn cho rằng quyền lợi của mình bị xâm phạm và chưa được giải quyết thỏa đáng, bạn có thể khiếu nại tới <strong className="text-ink">Bộ Thông tin và Truyền thông Việt Nam</strong> theo quy định hiện hành.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

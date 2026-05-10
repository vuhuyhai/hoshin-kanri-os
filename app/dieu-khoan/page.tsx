import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — Hoshin Kanri OS',
  description: 'Điều khoản sử dụng dịch vụ Hoshin Kanri OS — nền tảng quản lý chiến lược cho doanh nghiệp vừa và nhỏ tại Việt Nam.',
}

export default function DieuKhoanPage() {
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
          <p className="overline mb-3">Pháp lý</p>
          <h1 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
            Điều khoản sử dụng
          </h1>
          <p className="mt-4 font-body text-sm text-text-3">
            Có hiệu lực từ ngày 01 tháng 04 năm 2026
          </p>

          <div className="mt-10 space-y-8 font-body text-[17px] leading-[1.8] text-text-2">
            <p>
              Chào mừng bạn đến với <strong className="text-ink">Hoshin Kanri OS</strong> — nền tảng quản lý chiến lược cho doanh nghiệp vừa và nhỏ tại Việt Nam, vận hành tại địa chỉ <strong className="text-ink">chienluoc.org</strong>.
            </p>
            <p>
              Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý ràng buộc bởi các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng.
            </p>

            {/* 1. Định nghĩa */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">1. Định nghĩa</h2>
              <ul className="mt-4 space-y-2 list-disc pl-6">
                <li><strong className="text-ink">&ldquo;Dịch vụ&rdquo;</strong> là toàn bộ sản phẩm, tính năng và nội dung được cung cấp tại chienluoc.org, bao gồm Business X-Ray, Discovery Hub, X-Matrix Builder, KPI Tracker và các tính năng liên quan.</li>
                <li><strong className="text-ink">&ldquo;Tài khoản&rdquo;</strong> là tài khoản cá nhân hoặc tổ chức do bạn đăng ký để sử dụng Dịch vụ.</li>
                <li><strong className="text-ink">&ldquo;Tổ chức&rdquo;</strong> là doanh nghiệp hoặc đơn vị mà bạn đại diện khi sử dụng Dịch vụ.</li>
                <li><strong className="text-ink">&ldquo;Nội dung&rdquo;</strong> là mọi dữ liệu, văn bản, chiến lược, KPI và thông tin bạn nhập vào hệ thống.</li>
              </ul>
            </section>

            {/* 2. Điều kiện sử dụng */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">2. Điều kiện sử dụng</h2>

              <h3 className="mt-6 font-display text-base font-bold text-ink">2.1 Đối tượng sử dụng</h3>
              <p className="mt-2">
                Dịch vụ dành cho cá nhân từ 18 tuổi trở lên và doanh nghiệp được thành lập hợp pháp. Bạn xác nhận rằng thông tin đăng ký là chính xác và cập nhật.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">2.2 Tài khoản và bảo mật</h3>
              <p className="mt-2">
                Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Mọi hoạt động diễn ra dưới tài khoản của bạn đều được coi là do bạn thực hiện. Vui lòng thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép qua <strong className="text-ink">support@chienluoc.org</strong>.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">2.3 Sử dụng hợp lệ</h3>
              <p className="mt-2">Bạn đồng ý chỉ sử dụng Dịch vụ cho mục đích hợp pháp và không:</p>
              <ul className="mt-2 space-y-2 list-disc pl-6">
                <li>Sao chép, phân phối hoặc khai thác thương mại bất kỳ phần nào của Dịch vụ mà không được phép bằng văn bản</li>
                <li>Cố gắng truy cập trái phép vào hệ thống hoặc dữ liệu của tổ chức khác</li>
                <li>Sử dụng Dịch vụ để phát tán nội dung độc hại, vi phạm pháp luật hoặc gây hại cho người khác</li>
                <li>Thực hiện kỹ thuật đảo ngược (reverse engineering) hoặc can thiệp vào mã nguồn</li>
              </ul>
            </section>

            {/* 3. Quyền sở hữu trí tuệ */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">3. Quyền sở hữu trí tuệ</h2>

              <h3 className="mt-6 font-display text-base font-bold text-ink">3.1 Của Hoshin Kanri OS</h3>
              <p className="mt-2">
                Toàn bộ phương pháp luận, thiết kế giao diện, mã nguồn, nội dung hướng dẫn và tài liệu đào tạo thuộc sở hữu độc quyền của Hoshin Kanri OS. Bạn không được sử dụng thương hiệu, logo hoặc tên miền của chúng tôi mà không có sự cho phép bằng văn bản.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">3.2 Của người dùng</h3>
              <p className="mt-2">
                Nội dung bạn nhập vào hệ thống (chiến lược, KPI, dữ liệu doanh nghiệp) vẫn thuộc quyền sở hữu của bạn. Bạn cấp cho chúng tôi quyền sử dụng dữ liệu đó để vận hành và cải thiện Dịch vụ, theo quy định tại{' '}
                <Link href="/chinh-sach-bao-mat" className="font-semibold text-accent-brand underline underline-offset-2 hover:text-accent-dark transition-colors">
                  Chính sách bảo mật
                </Link>.
              </p>
            </section>

            {/* 4. Thanh toán */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">4. Thanh toán và gói dịch vụ</h2>

              <h3 className="mt-6 font-display text-base font-bold text-ink">4.1 Gói trả phí</h3>
              <p className="mt-2">
                Các gói dịch vụ trả phí được tính phí hàng tháng hoặc hàng năm theo biểu giá hiện hành tại trang Pricing. Giá có thể thay đổi với thông báo trước 30 ngày.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">4.2 Chính sách hoàn tiền</h3>
              <p className="mt-2">
                Chúng tôi cung cấp hoàn tiền 100% trong vòng 7 ngày đầu tiên của gói đầu tiên nếu bạn không hài lòng — không cần lý do. Sau 7 ngày, phí đã thu không được hoàn lại.
              </p>

              <h3 className="mt-6 font-display text-base font-bold text-ink">4.3 Hủy dịch vụ</h3>
              <p className="mt-2">
                Bạn có thể hủy gói đăng ký bất cứ lúc nào. Dịch vụ tiếp tục đến hết chu kỳ thanh toán hiện tại. Dữ liệu của bạn được giữ trong 90 ngày sau khi hủy, sau đó sẽ bị xóa vĩnh viễn.
              </p>
            </section>

            {/* 5. Giới hạn trách nhiệm */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">5. Giới hạn trách nhiệm</h2>
              <p className="mt-4">
                Hoshin Kanri OS cung cấp Dịch vụ theo hiện trạng (&ldquo;as-is&rdquo;). Chúng tôi không đảm bảo rằng:
              </p>
              <ul className="mt-2 space-y-2 list-disc pl-6">
                <li>Dịch vụ không bị gián đoạn hoặc không có lỗi kỹ thuật</li>
                <li>Kết quả phân tích và đề xuất chiến lược từ AI là hoàn toàn chính xác trong mọi trường hợp</li>
              </ul>
              <p className="mt-4">
                Trong phạm vi tối đa được pháp luật cho phép, tổng trách nhiệm của chúng tôi không vượt quá số tiền bạn đã thanh toán trong 3 tháng gần nhất.
              </p>
            </section>

            {/* 6. Chấm dứt */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">6. Chấm dứt dịch vụ</h2>
              <p className="mt-4">
                Chúng tôi có quyền tạm ngừng hoặc chấm dứt tài khoản của bạn nếu bạn vi phạm các điều khoản này. Bạn sẽ được thông báo trước khi chấm dứt, trừ trường hợp vi phạm nghiêm trọng.
              </p>
            </section>

            {/* 7. Thay đổi */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">7. Thay đổi điều khoản</h2>
              <p className="mt-4">
                Chúng tôi có thể cập nhật Điều khoản này theo thời gian. Thay đổi quan trọng sẽ được thông báo qua email đăng ký ít nhất 14 ngày trước khi có hiệu lực. Việc tiếp tục sử dụng Dịch vụ sau ngày có hiệu lực đồng nghĩa với việc bạn chấp thuận điều khoản mới.
              </p>
            </section>

            {/* 8. Luật áp dụng */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">8. Luật áp dụng</h2>
              <p className="mt-4">
                Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại Việt Nam.
              </p>
            </section>

            {/* 9. Liên hệ */}
            <section>
              <h2 className="font-display text-lg font-bold uppercase tracking-wider text-ink">9. Liên hệ</h2>
              <p className="mt-4">
                Nếu có câu hỏi về Điều khoản sử dụng, vui lòng liên hệ:
              </p>
              <p className="mt-2">
                <strong className="text-ink">legal@chienluoc.org</strong>
              </p>
              <p className="mt-1">Địa chỉ: Việt Nam</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

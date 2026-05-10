import Link from 'next/link'
import Image from 'next/image'

export default function BlogPostNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-warm">
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-bg-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link
            href="/"
            aria-label="Trang chủ Hoshin Kanri OS"
            className="flex items-center gap-2"
          >
            <Image
              src="/images/logo-light.png"
              alt="Hoshin Kanri OS"
              width={40}
              height={40}
              priority
            />
            <span className="font-display font-black text-sm uppercase tracking-wider">
              Hoshin Kanri OS
            </span>
          </Link>
          <nav aria-label="Menu chính" className="flex items-center gap-3">
            <Link
              href="/blog"
              className="hidden font-display text-xs font-semibold uppercase tracking-wider text-accent-brand md:inline-block"
            >
              Blog
            </Link>
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

      <main className="flex flex-1 items-center justify-center bg-bg-muted-warm px-6 py-20">
        <div className="card-brutal mx-auto max-w-xl p-10 text-center">
          <p className="overline mb-3">404</p>
          <h1
            className="font-display font-black uppercase text-ink leading-[1.05]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
          >
            Không tìm thấy <span className="text-accent-brand">bài viết</span>
          </h1>
          <p className="mt-5 font-body text-[15px] leading-relaxed text-text-2">
            Bài viết bạn đang tìm có thể đã bị xoá, đổi slug, hoặc chưa được
            đăng. Quay lại trang blog để xem các bài mới nhất.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/blog"
              className="btn-brutal-primary px-6 py-3 text-sm"
            >
              ← Về trang blog
            </Link>
            <Link
              href="/x-ray"
              className="btn-brutal-secondary px-6 py-3 text-sm"
            >
              Thử Business X-Ray
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

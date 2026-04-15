import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  listPublishedPosts,
  countPublishedPosts,
  listCategories,
  getCategoryBySlug,
} from '@/lib/blog/queries'
import { BlogSearch } from '@/components/blog/BlogSearch'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://chienluoc.org'
const PAGE_SIZE = 12

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
  const { category } = await searchParams
  const slug = category?.trim()
  if (!slug) {
    return {
      title: 'Blog — Hoshin Kanri OS',
      description:
        'Kiến thức chiến lược, Hoshin Kanri, OKR và điều hành SME Việt Nam từ đội ngũ Hoshin Kanri OS.',
      alternates: {
        canonical: `${SITE_URL}/blog`,
        types: {
          'application/rss+xml': `${SITE_URL}/blog/rss.xml`,
        },
      },
      openGraph: {
        type: 'website',
        url: `${SITE_URL}/blog`,
        title: 'Blog — Hoshin Kanri OS',
        description:
          'Kiến thức chiến lược, Hoshin Kanri, OKR và điều hành SME Việt Nam.',
        locale: 'vi_VN',
        siteName: 'Hoshin Kanri OS',
      },
    }
  }

  const cat = await getCategoryBySlug(slug).catch(() => null)
  const name = cat?.name ?? slug
  const url = `${SITE_URL}/blog?category=${slug}`
  const description =
    cat?.description ??
    `Bài viết thuộc danh mục ${name} trên blog Hoshin Kanri OS.`
  return {
    title: `${name} — Blog Hoshin Kanri OS`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${name} — Blog Hoshin Kanri OS`,
      description,
      locale: 'vi_VN',
      siteName: 'Hoshin Kanri OS',
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type SearchParams = Promise<{ page?: string; category?: string; q?: string }>

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { page: pageParam, category: categoryParam, q: qParam } = await searchParams
  const pageNum = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const offset = (pageNum - 1) * PAGE_SIZE
  const categorySlug = categoryParam?.trim() || undefined
  const searchQuery = qParam?.trim() ?? ''
  const hasSearch = searchQuery.length >= 2

  // Resilient: if the DB is unreachable or the table is missing (e.g.
  // migration not yet applied in the target env), show the empty state
  // instead of crashing the whole page with a 500.
  let posts: Awaited<ReturnType<typeof listPublishedPosts>> = []
  let total = 0
  let categories: Awaited<ReturnType<typeof listCategories>> = []
  let activeCategory: Awaited<ReturnType<typeof getCategoryBySlug>> = null
  try {
    ;[posts, total, categories, activeCategory] = await Promise.all([
      listPublishedPosts({
        limit: PAGE_SIZE,
        offset,
        categorySlug,
        searchQuery: hasSearch ? searchQuery : undefined,
      }),
      countPublishedPosts({
        categorySlug,
        searchQuery: hasSearch ? searchQuery : undefined,
      }),
      listCategories(),
      categorySlug ? getCategoryBySlug(categorySlug) : Promise.resolve(null),
    ])
  } catch (e) {
    console.error('/blog listing failed to load posts:', e)
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const searchQs = hasSearch ? `&q=${encodeURIComponent(searchQuery)}` : ''
  const baseHref = activeCategory
    ? `/blog?category=${activeCategory.slug}${searchQs}&`
    : `/blog?${hasSearch ? `q=${encodeURIComponent(searchQuery)}&` : ''}`

  return (
    <div className="flex min-h-screen flex-col">
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

      <main className="flex-1 bg-bg-warm">
        <section className="w-full border-b-[3px] border-ink">
          <div className="mx-auto max-w-[1440px] px-6 py-16 text-center lg:px-12 lg:py-24">
            <p className="heading-overline mb-3">
              {activeCategory ? `Danh mục: ${activeCategory.name}` : 'Blog'}
            </p>
            <h1
              className="font-display font-black uppercase text-ink leading-[1.05]"
              style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}
            >
              {activeCategory ? (
                <>
                  {activeCategory.name}{' '}
                  <span className="text-accent-brand">
                    ({total})
                  </span>
                </>
              ) : (
                <>
                  Kiến thức chiến lược
                  <br />
                  cho <span className="text-accent-brand">SME Việt Nam</span>
                </>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-body text-lg text-text-2">
              {activeCategory?.description ??
                'Hoshin Kanri, OKR, X-Matrix, SWOT và những bài học thực chiến từ việc đồng hành với chủ doanh nghiệp nhỏ và vừa.'}
            </p>
          </div>
        </section>

        <section className="w-full border-b-[3px] border-ink bg-bg-warm">
          <div className="mx-auto max-w-[1440px] space-y-5 px-6 py-5 lg:px-12">
            <div className="mx-auto max-w-2xl">
              <BlogSearch
                defaultValue={hasSearch ? searchQuery : ''}
                categorySlug={activeCategory?.slug}
              />
              {hasSearch && (
                <p className="mt-3 text-center font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">
                  Kết quả cho &quot;{searchQuery}&quot;: {total} bài
                </p>
              )}
            </div>
            {categories.length > 0 && (
              <div
                className="flex flex-wrap items-center justify-center gap-2"
                aria-label="Danh mục bài viết"
              >
                <Link
                  href={hasSearch ? `/blog?q=${encodeURIComponent(searchQuery)}` : '/blog'}
                  className={
                    activeCategory
                      ? 'btn-brutal-secondary px-4 py-2 text-[11px]'
                      : 'btn-brutal-primary px-4 py-2 text-[11px]'
                  }
                >
                  Tất cả
                </Link>
                {categories.map((c) => {
                  const isActive = activeCategory?.slug === c.slug
                  const catHref = hasSearch
                    ? `/blog?category=${c.slug}&q=${encodeURIComponent(searchQuery)}`
                    : `/blog?category=${c.slug}`
                  return (
                    <Link
                      key={c.id}
                      href={catHref}
                      className={
                        isActive
                          ? 'btn-brutal-primary px-4 py-2 text-[11px]'
                          : 'btn-brutal-secondary px-4 py-2 text-[11px]'
                      }
                    >
                      {c.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section className="w-full bg-bg-muted-warm py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            {posts.length === 0 ? (
              <div className="card-brutal mx-auto max-w-xl p-10 text-center">
                <p className="font-display text-lg font-bold uppercase text-ink">
                  {hasSearch
                    ? 'Không tìm thấy bài viết nào'
                    : activeCategory
                      ? 'Chưa có bài viết trong danh mục này'
                      : 'Chưa có bài viết nào'}
                </p>
                <p className="mt-3 font-body text-text-2">
                  {hasSearch ? (
                    <>
                      Thử từ khoá khác hoặc{' '}
                      <Link
                        href="/blog"
                        className="font-semibold text-accent-brand underline"
                      >
                        xem tất cả bài viết
                      </Link>
                      .
                    </>
                  ) : activeCategory ? (
                    <>
                      Quay lại{' '}
                      <Link
                        href="/blog"
                        className="font-semibold text-accent-brand underline"
                      >
                        tất cả bài viết
                      </Link>
                      .
                    </>
                  ) : (
                    <>
                      Blog sẽ có bài mới rất sớm. Trong khi chờ, bạn có thể
                      thử{' '}
                      <Link
                        href="/x-ray"
                        className="font-semibold text-accent-brand underline"
                      >
                        Business X-Ray
                      </Link>{' '}
                      để chẩn đoán doanh nghiệp trong 10 phút.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="card-brutal flex flex-col overflow-hidden">
                    {post.cover_url ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="block border-b-[3px] border-ink"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          className="aspect-[16/9] w-full object-cover"
                          loading="lazy"
                        />
                      </Link>
                    ) : (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="flex aspect-[16/9] w-full items-center justify-center border-b-[3px] border-ink bg-accent-brand"
                      >
                        <span className="font-display text-4xl font-black uppercase tracking-wider text-bg-warm">
                          HK
                        </span>
                      </Link>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">
                        <span>{formatDate(post.published_at)}</span>
                        {post.category && (
                          <>
                            <span aria-hidden>•</span>
                            <Link
                              href={`/blog?category=${post.category.slug}`}
                              className="text-accent-brand hover:underline"
                            >
                              {post.category.name}
                            </Link>
                          </>
                        )}
                      </div>
                      <h2 className="mb-3 font-display text-xl font-black uppercase leading-tight text-ink">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="hover:text-accent-brand"
                        >
                          {post.title}
                        </Link>
                      </h2>
                      <p className="mb-5 flex-1 font-body text-[15px] leading-relaxed text-text-2">
                        {post.excerpt}
                      </p>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-display text-xs font-bold uppercase tracking-wider text-accent-brand hover:underline"
                      >
                        Đọc tiếp →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Phân trang blog"
                className="mt-12 flex items-center justify-center gap-4"
              >
                {pageNum > 1 ? (
                  <Link
                    href={`${baseHref}page=${pageNum - 1}`}
                    className="btn-brutal-secondary px-5 py-2.5 text-xs"
                  >
                    ← Trang trước
                  </Link>
                ) : (
                  <span className="btn-brutal-secondary px-5 py-2.5 text-xs opacity-40">
                    ← Trang trước
                  </span>
                )}
                <span className="font-display text-sm font-semibold text-ink">
                  Trang {pageNum} / {totalPages}
                </span>
                {pageNum < totalPages ? (
                  <Link
                    href={`${baseHref}page=${pageNum + 1}`}
                    className="btn-brutal-secondary px-5 py-2.5 text-xs"
                  >
                    Trang sau →
                  </Link>
                ) : (
                  <span className="btn-brutal-secondary px-5 py-2.5 text-xs opacity-40">
                    Trang sau →
                  </span>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

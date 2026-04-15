import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPublishedPostBySlug } from '@/lib/blog/queries'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'
import { ViewTracker } from './ViewTracker'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://chienluoc.org'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await safeGetPost(slug)
  if (!post) {
    return { title: 'Không tìm thấy bài viết — Hoshin Kanri OS' }
  }
  const url = `${SITE_URL}/blog/${post.slug}`
  return {
    title: `${post.title} — Hoshin Kanri OS`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      locale: 'vi_VN',
      siteName: 'Hoshin Kanri OS',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
    twitter: {
      card: post.cover_url ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

async function safeGetPost(slug: string) {
  try {
    return await getPublishedPostBySlug(slug)
  } catch (e) {
    console.error(`/blog/${slug} query failed:`, e)
    return null
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await safeGetPost(slug)
  if (!post) notFound()

  const url = `${SITE_URL}/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.cover_url ? [post.cover_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: 'Hoshin Kanri OS' },
    publisher: {
      '@type': 'Organization',
      name: 'Hoshin Kanri OS',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo-light.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker slug={post.slug} />

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
        <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
          <div className="mb-8">
            <Link
              href="/blog"
              className="font-display text-xs font-semibold uppercase tracking-wider text-text-3 hover:text-accent-brand"
            >
              ← Quay lại blog
            </Link>
          </div>

          <header className="mb-10 border-b-[3px] border-ink pb-8">
            <p className="heading-overline mb-4">Bài viết</p>
            <h1
              className="font-display font-black uppercase text-ink leading-[1.1]"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}
            >
              {post.title}
            </h1>
            <p className="mt-6 font-body text-lg leading-relaxed text-text-2">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center gap-4 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">
              <span>{formatDate(post.published_at)}</span>
              <span aria-hidden>•</span>
              <span>{post.views_count.toLocaleString('vi-VN')} lượt xem</span>
            </div>
          </header>

          {post.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_url}
              alt={post.title}
              className="mb-10 w-full border-[3px] border-ink shadow-[5px_5px_0_#2C2B2B]"
            />
          )}

          <MarkdownRenderer content={post.content_md} />

          <footer className="mt-16 border-t-[3px] border-ink pt-8">
            <div className="card-brutal bg-bg-muted-warm p-8 text-center">
              <p className="font-display text-sm font-semibold uppercase tracking-wider text-text-3">
                Sẵn sàng biến chiến lược thành hành động?
              </p>
              <h3 className="mt-3 font-display text-2xl font-black uppercase text-ink">
                Thử <span className="text-accent-brand">Business X-Ray</span> miễn phí
              </h3>
              <p className="mt-3 font-body text-text-2">
                10 phút để chẩn đoán tình trạng doanh nghiệp của bạn và nhận
                báo cáo chi tiết.
              </p>
              <Link
                href="/x-ray"
                className="btn-brutal-primary mt-6 inline-block px-6 py-3 text-sm"
              >
                Bắt đầu X-Ray →
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  )
}

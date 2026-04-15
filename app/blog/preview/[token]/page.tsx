import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  getPostByPreviewToken,
  getAuthorById,
} from '@/lib/blog/queries'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { AuthorByline } from '@/components/blog/AuthorByline'
import { PostTags } from '@/components/blog/PostTags'
import { extractHeadings, calcReadingMinutes } from '@/lib/blog/toc'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

// Preview pages must never be indexed. Draft content leaking into
// Google defeats the whole point of a private preview link.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Preview — Hoshin Kanri OS',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Chưa đăng'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPreviewPage({ params }: Props) {
  const { token } = await params

  let post: Awaited<ReturnType<typeof getPostByPreviewToken>> = null
  try {
    post = await getPostByPreviewToken(token)
  } catch (e) {
    console.error(`/blog/preview/${token} query failed:`, e)
  }
  if (!post) notFound()

  const readingMinutes = calcReadingMinutes(post.content_md)
  const tocItems = extractHeadings(post.content_md)
  const author = await getAuthorById(post.author_id)

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
          <span className="badge-brutal border-accent-brand text-accent-brand">
            PREVIEW · {post.status.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="border-b-[3px] border-ink bg-accent-brand px-6 py-3 text-center">
        <p className="font-display text-[12px] font-black uppercase tracking-wider text-bg-warm">
          Đây là bản preview dành cho super-admin. Không chia sẻ link này với
          công khai.
        </p>
      </div>

      <main className="flex-1 bg-bg-warm">
        <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
          <header className="mb-10 border-b-[3px] border-ink pb-8">
            <p className="heading-overline mb-4">Preview bài viết</p>
            {post.category && (
              <span className="badge-brutal mb-4 inline-block border-accent-brand text-accent-brand">
                {post.category.name}
              </span>
            )}
            <h1
              className="font-display font-black uppercase text-ink leading-[1.1]"
              style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}
            >
              {post.title}
            </h1>
            <p className="mt-6 font-body text-lg leading-relaxed text-text-2">
              {post.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">
              <span>{formatDate(post.published_at)}</span>
              <span aria-hidden>•</span>
              <span>{readingMinutes} phút đọc</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <AuthorByline author={author} />
              <PostTags tags={post.tags} />
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

          <TableOfContents items={tocItems} />
          <MarkdownRenderer content={post.content_md} />
        </article>
      </main>
    </div>
  )
}

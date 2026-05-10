import Link from 'next/link'
import type { BlogPostSummary } from '@/lib/blog/queries'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function RelatedPosts({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null

  return (
    <section className="mt-16 border-t-[3px] border-ink pt-10">
      <p className="overline mb-3">Bài viết liên quan</p>
      <h2 className="mb-8 font-display text-2xl font-black uppercase text-ink">
        Đọc tiếp
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="card-brutal flex flex-col overflow-hidden"
          >
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
                <span className="font-display text-2xl font-black uppercase tracking-wider text-bg-warm">
                  HK
                </span>
              </Link>
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">
                <span>{formatDate(post.published_at)}</span>
                {post.category && (
                  <>
                    <span aria-hidden>•</span>
                    <span className="text-accent-brand">
                      {post.category.name}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-display text-base font-black uppercase leading-tight text-ink">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-accent-brand"
                >
                  {post.title}
                </Link>
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

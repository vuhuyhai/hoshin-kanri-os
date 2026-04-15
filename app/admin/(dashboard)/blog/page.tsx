export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { adminListAllPosts } from '@/lib/blog/queries'
import { DeletePostButton } from './DeletePostButton'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function BlogAdminContent() {
  const posts = await adminListAllPosts()
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.length - publishedCount

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink">
            Blog
          </h1>
          <span className="badge-brutal border-ink text-ink">
            {publishedCount} đã đăng
          </span>
          <span className="badge-brutal border-text-3 text-text-3">
            {draftCount} nháp
          </span>
        </div>
        <Link
          href="/admin/blog/new"
          className="btn-brutal-primary px-5 py-2.5 text-xs"
        >
          + Bài viết mới
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card-brutal p-10 text-center">
          <p className="font-display text-lg font-bold uppercase text-ink">
            Chưa có bài viết nào
          </p>
          <p className="mt-2 font-body text-text-2">
            Bấm &quot;Bài viết mới&quot; để tạo bài đầu tiên.
          </p>
        </div>
      ) : (
        <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-[3px] border-ink bg-ink text-bg-warm">
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Lượt xem
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Cập nhật
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  {''}
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b-[2px] border-ink/20 last:border-b-0 hover:bg-bg-muted-warm"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="font-display text-sm font-bold text-ink hover:text-accent-brand"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-text-3">
                      /{post.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {post.status === 'published' ? (
                      <span className="badge-brutal border-accent-brand text-accent-brand">
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="badge-brutal border-text-3 text-text-3">
                        DRAFT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-display text-sm text-ink">
                    {post.views_count.toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-text-2">
                    {formatDateTime(post.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.status === 'published' && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-3 hover:text-accent-brand"
                        >
                          Xem
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="font-display text-[11px] font-semibold uppercase tracking-wider text-ink hover:text-accent-brand"
                      >
                        Sửa
                      </Link>
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function BlogAdminPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse bg-ink/10" />
            <div className="h-64 animate-pulse bg-ink/10" />
          </div>
        }
      >
        <BlogAdminContent />
      </Suspense>
    </div>
  )
}

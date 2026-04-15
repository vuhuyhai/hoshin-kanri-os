import Link from 'next/link'
import { BlogForm } from '../BlogForm'
import { createBlogPostAction } from '../_actions'

export const dynamic = 'force-dynamic'

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-3 hover:text-accent-brand"
        >
          ← Blog
        </Link>
        <h1 className="mt-2 font-display text-2xl font-black uppercase tracking-wider text-ink">
          Bài viết mới
        </h1>
      </div>
      <BlogForm action={createBlogPostAction} submitLabel="Tạo bài viết" />
    </div>
  )
}

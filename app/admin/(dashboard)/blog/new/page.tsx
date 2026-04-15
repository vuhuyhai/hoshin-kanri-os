import Link from 'next/link'
import { BlogForm } from '../BlogForm'
import { createBlogPostAction } from '../_actions'
import { adminListCategories } from '@/lib/blog/queries'

export const dynamic = 'force-dynamic'

async function safeListCategories() {
  try {
    return await adminListCategories()
  } catch (e) {
    console.error('[admin/blog/new] category list failed:', e)
    return []
  }
}

export default async function NewBlogPostPage() {
  const categories = await safeListCategories()
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
      <BlogForm
        action={createBlogPostAction}
        submitLabel="Tạo bài viết"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}

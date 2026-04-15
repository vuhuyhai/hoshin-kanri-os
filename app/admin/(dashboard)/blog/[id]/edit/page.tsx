import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  adminGetPost,
  adminListCategories,
  adminListTags,
} from '@/lib/blog/queries'
import { BlogForm } from '../../BlogForm'
import { updateBlogPostAction } from '../../_actions'
import { PreviewLinkPanel } from './PreviewLinkPanel'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function safeListCategories() {
  try {
    return await adminListCategories()
  } catch (e) {
    console.error('[admin/blog/edit] category list failed:', e)
    return []
  }
}

async function safeListTags() {
  try {
    return await adminListTags()
  } catch (e) {
    console.error('[admin/blog/edit] tag list failed:', e)
    return []
  }
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params

  let post: Awaited<ReturnType<typeof adminGetPost>> = null
  try {
    post = await adminGetPost(id)
  } catch (e) {
    console.error('[admin/blog/edit] adminGetPost failed:', e)
    // Fall through to notFound(); the server action will surface the
    // real error message (missing table, etc.) when the user submits.
  }
  if (!post) notFound()

  const [categories, tags] = await Promise.all([
    safeListCategories(),
    safeListTags(),
  ])
  const boundAction = updateBlogPostAction.bind(null, id)

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
          Sửa bài viết
        </h1>
        <p className="mt-1 font-mono text-[11px] text-text-3">id: {post.id}</p>
      </div>

      <PreviewLinkPanel
        postId={post.id}
        initialToken={post.preview_token}
        status={post.status}
      />

      <BlogForm
        action={boundAction}
        initial={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          cover_url: post.cover_url ?? '',
          content_md: post.content_md,
          status: post.status,
          category_id: post.category_id ?? '',
          tag_ids: post.tags.map((t) => t.id),
        }}
        submitLabel="Lưu thay đổi"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  )
}

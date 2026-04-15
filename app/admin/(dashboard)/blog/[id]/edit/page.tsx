import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminGetPost } from '@/lib/blog/queries'
import { BlogForm } from '../../BlogForm'
import { updateBlogPostAction } from '../../_actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const post = await adminGetPost(id)
  if (!post) notFound()

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
      <BlogForm
        action={boundAction}
        initial={{
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          cover_url: post.cover_url ?? '',
          content_md: post.content_md,
          status: post.status,
        }}
        submitLabel="Lưu thay đổi"
      />
    </div>
  )
}

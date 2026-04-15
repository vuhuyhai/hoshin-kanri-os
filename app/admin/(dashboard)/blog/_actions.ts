'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  adminGetPostBySlug,
} from '@/lib/blog/queries'
import { blogPostSchema } from '@/lib/blog/schema'

type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

// Defense-in-depth: middleware already gates /admin/* routes, but server
// actions are cheap to re-verify. Returns the authenticated super-admin
// user id on success or throws a redirect on failure.
async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_super_admin) redirect('/admin/login')
  return user.id
}

function parseFormData(formData: FormData) {
  return blogPostSchema.safeParse({
    slug: formData.get('slug') ?? '',
    title: formData.get('title') ?? '',
    excerpt: formData.get('excerpt') ?? '',
    cover_url: formData.get('cover_url') ?? '',
    content_md: formData.get('content_md') ?? '',
    status: formData.get('status') ?? 'draft',
  })
}

export async function createBlogPostAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireSuperAdmin()

  const parsed = parseFormData(formData)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? 'Dữ liệu không hợp lệ',
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? ''), i.message])
      ),
    }
  }

  const existing = await adminGetPostBySlug(parsed.data.slug)
  if (existing) {
    return {
      ok: false,
      error: 'Slug đã tồn tại, vui lòng chọn slug khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminCreatePost(
      {
        slug: parsed.data.slug,
        title: parsed.data.title,
        excerpt: parsed.data.excerpt,
        cover_url: parsed.data.cover_url ?? null,
        content_md: parsed.data.content_md,
        status: parsed.data.status,
      },
      userId
    )
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Lỗi không xác định',
    }
  }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  revalidatePath(`/blog/${parsed.data.slug}`)
  redirect('/admin/blog')
}

export async function updateBlogPostAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin()

  const parsed = parseFormData(formData)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? 'Dữ liệu không hợp lệ',
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? ''), i.message])
      ),
    }
  }

  const existing = await adminGetPostBySlug(parsed.data.slug)
  if (existing && existing.id !== id) {
    return {
      ok: false,
      error: 'Slug đã tồn tại trên một bài viết khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminUpdatePost(id, {
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      cover_url: parsed.data.cover_url ?? null,
      content_md: parsed.data.content_md,
      status: parsed.data.status,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Lỗi không xác định',
    }
  }

  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${id}/edit`)
  revalidatePath('/blog')
  revalidatePath(`/blog/${parsed.data.slug}`)
  redirect('/admin/blog')
}

export async function deleteBlogPostAction(
  id: string
): Promise<ActionResult> {
  await requireSuperAdmin()

  try {
    await adminDeletePost(id)
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Lỗi không xác định',
    }
  }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

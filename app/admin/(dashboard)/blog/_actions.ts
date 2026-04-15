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
  adminSetPostTags,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetCategoryBySlug,
  adminCreateTag,
  adminUpdateTag,
  adminDeleteTag,
  adminGetTagBySlug,
  adminEnsurePreviewToken,
  adminRotatePreviewToken,
  adminRevokePreviewToken,
} from '@/lib/blog/queries'
import {
  blogPostSchema,
  blogCategorySchema,
  blogTagSchema,
} from '@/lib/blog/schema'
import { describeDbError } from '@/lib/blog/errors'

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
  const rawTagIds = formData.getAll('tag_ids').map((v) => String(v)).filter(Boolean)
  return blogPostSchema.safeParse({
    slug: formData.get('slug') ?? '',
    title: formData.get('title') ?? '',
    excerpt: formData.get('excerpt') ?? '',
    cover_url: formData.get('cover_url') ?? '',
    content_md: formData.get('content_md') ?? '',
    status: formData.get('status') ?? 'draft',
    category_id: formData.get('category_id') ?? '',
    tag_ids: rawTagIds,
  })
}

function parseCategoryFormData(formData: FormData) {
  return blogCategorySchema.safeParse({
    slug: formData.get('slug') ?? '',
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
  })
}

function parseTagFormData(formData: FormData) {
  return blogTagSchema.safeParse({
    slug: formData.get('slug') ?? '',
    name: formData.get('name') ?? '',
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

  let existing: Awaited<ReturnType<typeof adminGetPostBySlug>>
  try {
    existing = await adminGetPostBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[createBlogPostAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
  if (existing) {
    return {
      ok: false,
      error: 'Slug đã tồn tại, vui lòng chọn slug khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    const created = await adminCreatePost(
      {
        slug: parsed.data.slug,
        title: parsed.data.title,
        excerpt: parsed.data.excerpt,
        cover_url: parsed.data.cover_url ?? null,
        content_md: parsed.data.content_md,
        status: parsed.data.status,
        category_id: parsed.data.category_id ?? null,
      },
      userId
    )
    if (parsed.data.tag_ids.length > 0) {
      await adminSetPostTags(created.id, parsed.data.tag_ids)
    }
  } catch (e) {
    console.error('[createBlogPostAction] create failed:', e)
    return { ok: false, error: describeDbError(e) }
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

  let existing: Awaited<ReturnType<typeof adminGetPostBySlug>>
  try {
    existing = await adminGetPostBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[updateBlogPostAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
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
      category_id: parsed.data.category_id ?? null,
    })
    await adminSetPostTags(id, parsed.data.tag_ids)
  } catch (e) {
    console.error('[updateBlogPostAction] update failed:', e)
    return { ok: false, error: describeDbError(e) }
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
    console.error('[deleteBlogPostAction] delete failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

// ============================================================
// Categories
// ============================================================

export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin()

  const parsed = parseCategoryFormData(formData)
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

  let existing: Awaited<ReturnType<typeof adminGetCategoryBySlug>>
  try {
    existing = await adminGetCategoryBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[createCategoryAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
  if (existing) {
    return {
      ok: false,
      error: 'Slug đã tồn tại, chọn slug khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminCreateCategory({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
  } catch (e) {
    console.error('[createCategoryAction] create failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/categories')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin()

  const parsed = parseCategoryFormData(formData)
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

  let existing: Awaited<ReturnType<typeof adminGetCategoryBySlug>>
  try {
    existing = await adminGetCategoryBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[updateCategoryAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
  if (existing && existing.id !== id) {
    return {
      ok: false,
      error: 'Slug đã tồn tại ở danh mục khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminUpdateCategory(id, {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
  } catch (e) {
    console.error('[updateCategoryAction] update failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/categories')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

export async function deleteCategoryAction(
  id: string
): Promise<ActionResult> {
  await requireSuperAdmin()

  try {
    await adminDeleteCategory(id)
  } catch (e) {
    console.error('[deleteCategoryAction] delete failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/categories')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

// ============================================================
// Tags
// ============================================================

export async function createTagAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin()

  const parsed = parseTagFormData(formData)
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

  let existing: Awaited<ReturnType<typeof adminGetTagBySlug>>
  try {
    existing = await adminGetTagBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[createTagAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
  if (existing) {
    return {
      ok: false,
      error: 'Slug đã tồn tại, chọn slug khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminCreateTag({ slug: parsed.data.slug, name: parsed.data.name })
  } catch (e) {
    console.error('[createTagAction] create failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/tags')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

export async function updateTagAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireSuperAdmin()

  const parsed = parseTagFormData(formData)
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

  let existing: Awaited<ReturnType<typeof adminGetTagBySlug>>
  try {
    existing = await adminGetTagBySlug(parsed.data.slug)
  } catch (e) {
    console.error('[updateTagAction] slug lookup failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
  if (existing && existing.id !== id) {
    return {
      ok: false,
      error: 'Slug đã tồn tại ở tag khác',
      fieldErrors: { slug: 'Slug đã tồn tại' },
    }
  }

  try {
    await adminUpdateTag(id, {
      slug: parsed.data.slug,
      name: parsed.data.name,
    })
  } catch (e) {
    console.error('[updateTagAction] update failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/tags')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  await requireSuperAdmin()

  try {
    await adminDeleteTag(id)
  } catch (e) {
    console.error('[deleteTagAction] delete failed:', e)
    return { ok: false, error: describeDbError(e) }
  }

  revalidatePath('/admin/blog/tags')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { ok: true }
}

// ============================================================
// Draft preview token
// ============================================================

type PreviewTokenResult =
  | { ok: true; token: string | null }
  | { ok: false; error: string }

export async function ensurePreviewTokenAction(
  postId: string
): Promise<PreviewTokenResult> {
  await requireSuperAdmin()
  try {
    const token = await adminEnsurePreviewToken(postId)
    revalidatePath(`/admin/blog/${postId}/edit`)
    return { ok: true, token }
  } catch (e) {
    console.error('[ensurePreviewTokenAction] failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
}

export async function rotatePreviewTokenAction(
  postId: string
): Promise<PreviewTokenResult> {
  await requireSuperAdmin()
  try {
    const token = await adminRotatePreviewToken(postId)
    revalidatePath(`/admin/blog/${postId}/edit`)
    return { ok: true, token }
  } catch (e) {
    console.error('[rotatePreviewTokenAction] failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
}

export async function revokePreviewTokenAction(
  postId: string
): Promise<PreviewTokenResult> {
  await requireSuperAdmin()
  try {
    await adminRevokePreviewToken(postId)
    revalidatePath(`/admin/blog/${postId}/edit`)
    return { ok: true, token: null }
  } catch (e) {
    console.error('[revokePreviewTokenAction] failed:', e)
    return { ok: false, error: describeDbError(e) }
  }
}

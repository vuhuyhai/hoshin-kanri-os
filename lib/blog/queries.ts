// Server-side blog queries. Public reads use the anon client so RLS
// applies (only 'published' rows visible). Admin CMS reads/writes go
// through the service-role admin client so drafts are visible and
// writes bypass RLS — super-admin gating happens in server actions.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type BlogCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  content_md: string
  status: 'draft' | 'published'
  author_id: string | null
  category_id: string | null
  published_at: string | null
  views_count: number
  created_at: string
  updated_at: string
}

// Listing/detail rows include the resolved category so the UI doesn't
// need a second round-trip per post.
export type BlogPostWithCategory = BlogPost & {
  category: Pick<BlogCategory, 'id' | 'slug' | 'name'> | null
}

export type BlogPostSummary = Omit<BlogPostWithCategory, 'content_md'>

// Raw shape Supabase returns for the joined select. `category` comes
// back as a single-object relation because blog_posts.category_id is
// a 1-N FK — but the Supabase TS generator doesn't always infer this,
// so we cast through unknown below.
type RawJoinedPost = Omit<BlogPost, never> & {
  category: Pick<BlogCategory, 'id' | 'slug' | 'name'> | null
}

const POST_SUMMARY_COLUMNS =
  'id, slug, title, excerpt, cover_url, status, author_id, category_id, published_at, views_count, created_at, updated_at, category:blog_categories(id, slug, name)'

const POST_FULL_COLUMNS = `*, category:blog_categories(id, slug, name)`

function normalizePost(raw: unknown): BlogPostWithCategory {
  const r = raw as BlogPost & {
    category:
      | Pick<BlogCategory, 'id' | 'slug' | 'name'>
      | Pick<BlogCategory, 'id' | 'slug' | 'name'>[]
      | null
  }
  // Supabase can return either an object or an array depending on how
  // the FK is declared. Flatten to a single object or null.
  const cat = Array.isArray(r.category) ? (r.category[0] ?? null) : r.category
  return { ...(r as BlogPost), category: cat ?? null }
}

function normalizeSummary(raw: unknown): BlogPostSummary {
  const full = normalizePost(raw)
  const { content_md: _ignored, ...summary } = full
  return summary
}

// ============================================================
// Public reads — blog posts
// ============================================================

export async function listPublishedPosts(params?: {
  limit?: number
  offset?: number
  categorySlug?: string
}): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0

  let query = supabase
    .from('blog_posts')
    .select(POST_SUMMARY_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params?.categorySlug) {
    // Filter by the joined category's slug. PostgREST supports dotted
    // filters on embedded tables.
    query = query.eq('category.slug', params.categorySlug)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(normalizeSummary)
}

export async function countPublishedPosts(params?: {
  categorySlug?: string
}): Promise<number> {
  const supabase = await createClient()
  let query = supabase
    .from('blog_posts')
    .select('id, category:blog_categories(id, slug)', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'published')

  if (params?.categorySlug) {
    query = query.eq('category.slug', params.categorySlug)
  }

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<BlogPostWithCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(POST_FULL_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizePost(data)
}

export async function listAllPublishedSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as { slug: string; updated_at: string }[]
}

// ============================================================
// Public reads — categories
// ============================================================

export async function listCategories(): Promise<BlogCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as BlogCategory[]
}

export async function getCategoryBySlug(
  slug: string
): Promise<BlogCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return (data as BlogCategory | null) ?? null
}

// ============================================================
// Admin reads/writes — posts (service role, bypass RLS)
// ============================================================

export async function adminListAllPosts(): Promise<BlogPostSummary[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select(POST_SUMMARY_COLUMNS)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(normalizeSummary)
}

export async function adminGetPost(
  id: string
): Promise<BlogPostWithCategory | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select(POST_FULL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizePost(data)
}

export async function adminGetPostBySlug(
  slug: string
): Promise<BlogPostWithCategory | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select(POST_FULL_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizePost(data)
}

type UpsertInput = {
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  content_md: string
  status: 'draft' | 'published'
  category_id: string | null
}

export async function adminCreatePost(
  input: UpsertInput,
  authorId: string
): Promise<BlogPost> {
  const db = createAdminClient()
  const publishedAt =
    input.status === 'published' ? new Date().toISOString() : null

  const { data, error } = await db
    .from('blog_posts')
    .insert({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      cover_url: input.cover_url,
      content_md: input.content_md,
      status: input.status,
      category_id: input.category_id,
      author_id: authorId,
      published_at: publishedAt,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function adminUpdatePost(
  id: string,
  input: UpsertInput
): Promise<BlogPost> {
  const db = createAdminClient()

  const existing = await adminGetPost(id)
  if (!existing) throw new Error('Bài viết không tồn tại')

  const becomingPublished =
    input.status === 'published' && existing.status !== 'published'
  const publishedAt = becomingPublished
    ? new Date().toISOString()
    : existing.published_at

  const { data, error } = await db
    .from('blog_posts')
    .update({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      cover_url: input.cover_url,
      content_md: input.content_md,
      status: input.status,
      category_id: input.category_id,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function adminDeletePost(id: string): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// Admin reads/writes — categories (service role, bypass RLS)
// ============================================================

export async function adminListCategories(): Promise<
  (BlogCategory & { post_count: number })[]
> {
  const db = createAdminClient()
  const { data: categories, error } = await db
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error

  // Count posts per category in a second roundtrip — simpler than a
  // JSON aggregation RPC and fine for the small scale we expect here.
  const { data: posts, error: postErr } = await db
    .from('blog_posts')
    .select('category_id')
  if (postErr) throw postErr

  const counts = new Map<string, number>()
  for (const p of posts ?? []) {
    const cid = (p as { category_id: string | null }).category_id
    if (cid) counts.set(cid, (counts.get(cid) ?? 0) + 1)
  }

  return ((categories ?? []) as BlogCategory[]).map((c) => ({
    ...c,
    post_count: counts.get(c.id) ?? 0,
  }))
}

export async function adminGetCategoryBySlug(
  slug: string
): Promise<BlogCategory | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return (data as BlogCategory | null) ?? null
}

type CategoryUpsertInput = {
  slug: string
  name: string
  description: string | null
}

export async function adminCreateCategory(
  input: CategoryUpsertInput
): Promise<BlogCategory> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_categories')
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as BlogCategory
}

export async function adminUpdateCategory(
  id: string,
  input: CategoryUpsertInput
): Promise<BlogCategory> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_categories')
    .update({
      slug: input.slug,
      name: input.name,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as BlogCategory
}

export async function adminDeleteCategory(id: string): Promise<void> {
  const db = createAdminClient()
  // ON DELETE SET NULL in the migration lets posts survive the delete
  // as uncategorized — no need to touch them here.
  const { error } = await db.from('blog_categories').delete().eq('id', id)
  if (error) throw error
}

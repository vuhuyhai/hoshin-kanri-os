// Server-side blog queries. Public reads use the anon client so RLS
// applies (only 'published' rows visible). Admin CMS reads/writes go
// through the service-role admin client so drafts are visible and
// writes bypass RLS — super-admin gating happens in server actions.
//
// Posts and categories are fetched in two separate round-trips
// (post query first, then a single batch category lookup via
// attachCategories) instead of a PostgREST embed. That way the blog
// keeps working even if the blog_categories table hasn't been
// created yet — a PostgREST embed would fail the whole post query
// with a schema-cache error on an un-applied migration.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isMissingTableError } from './errors'

export type BlogCategory = {
  id: string
  slug: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type CategoryRef = Pick<BlogCategory, 'id' | 'slug' | 'name'>

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

export type BlogPostWithCategory = BlogPost & { category: CategoryRef | null }
export type BlogPostSummary = Omit<BlogPostWithCategory, 'content_md'>

// Minimum shape any row we want to enrich with a category must have.
type HasCategoryId = { category_id: string | null }

// Lightweight client surface so this helper is reusable by both
// the anon (user-scoped) and service-role admin clients.
type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      in: (column: string, values: string[]) => Promise<{
        data: unknown[] | null
        error: { code?: string; message?: string } | null
      }>
    }
  }
}

const POST_SUMMARY_COLUMNS =
  'id, slug, title, excerpt, cover_url, status, author_id, category_id, published_at, views_count, created_at, updated_at'

/**
 * Attach resolved category objects to an array of rows in a single
 * batch query. Fail-soft: if blog_categories doesn't exist yet
 * (migration not applied), every row comes back with category: null
 * instead of throwing.
 */
async function attachCategories<T extends HasCategoryId>(
  supabase: SupabaseLike,
  rows: T[]
): Promise<(T & { category: CategoryRef | null })[]> {
  if (rows.length === 0) return []

  const ids = Array.from(
    new Set(
      rows
        .map((r) => r.category_id)
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
    )
  )

  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, category: null }))
  }

  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('id, slug, name')
      .in('id', ids)
    if (error) throw error

    const map = new Map<string, CategoryRef>()
    for (const row of (data ?? []) as CategoryRef[]) {
      map.set(row.id, row)
    }

    return rows.map((r) => ({
      ...r,
      category: r.category_id ? (map.get(r.category_id) ?? null) : null,
    }))
  } catch (e) {
    if (isMissingTableError(e)) {
      return rows.map((r) => ({ ...r, category: null }))
    }
    throw e
  }
}

// ============================================================
// Public reads — categories
// ============================================================

export async function listCategories(): Promise<BlogCategory[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as BlogCategory[]
  } catch (e) {
    if (isMissingTableError(e)) return []
    throw e
  }
}

export async function getCategoryBySlug(
  slug: string
): Promise<BlogCategory | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    return (data as BlogCategory | null) ?? null
  } catch (e) {
    if (isMissingTableError(e)) return null
    throw e
  }
}

// ============================================================
// Public reads — blog posts
// ============================================================

function escapeIlike(input: string): string {
  return input.replace(/[%,()]/g, ' ').trim()
}

export async function listPublishedPosts(params?: {
  limit?: number
  offset?: number
  categorySlug?: string
  searchQuery?: string
}): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0

  let categoryFilterId: string | undefined
  if (params?.categorySlug) {
    const cat = await getCategoryBySlug(params.categorySlug)
    if (!cat) return []
    categoryFilterId = cat.id
  }

  let query = supabase
    .from('blog_posts')
    .select(POST_SUMMARY_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (categoryFilterId) {
    query = query.eq('category_id', categoryFilterId)
  }

  const q = params?.searchQuery ? escapeIlike(params.searchQuery) : ''
  if (q.length >= 2) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as (Omit<BlogPost, 'content_md'>)[]
  const withCategory = await attachCategories(
    supabase as unknown as SupabaseLike,
    rows
  )
  return withCategory as BlogPostSummary[]
}

export async function countPublishedPosts(params?: {
  categorySlug?: string
  searchQuery?: string
}): Promise<number> {
  const supabase = await createClient()

  let categoryFilterId: string | undefined
  if (params?.categorySlug) {
    const cat = await getCategoryBySlug(params.categorySlug)
    if (!cat) return 0
    categoryFilterId = cat.id
  }

  let query = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (categoryFilterId) {
    query = query.eq('category_id', categoryFilterId)
  }

  const q = params?.searchQuery ? escapeIlike(params.searchQuery) : ''
  if (q.length >= 2) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
  }

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function listRelatedPosts(params: {
  currentId: string
  categoryId: string | null
  limit?: number
}): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const limit = params.limit ?? 3

  let query = supabase
    .from('blog_posts')
    .select(POST_SUMMARY_COLUMNS)
    .eq('status', 'published')
    .neq('id', params.currentId)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as (Omit<BlogPost, 'content_md'>)[]

  if (rows.length < limit && params.categoryId) {
    const excludeIds = [params.currentId, ...rows.map((r) => r.id)]
    const { data: extra, error: extraErr } = await supabase
      .from('blog_posts')
      .select(POST_SUMMARY_COLUMNS)
      .eq('status', 'published')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(limit - rows.length)
    if (extraErr) throw extraErr
    rows.push(...((extra ?? []) as (Omit<BlogPost, 'content_md'>)[]))
  }

  const withCategory = await attachCategories(
    supabase as unknown as SupabaseLike,
    rows
  )
  return withCategory as BlogPostSummary[]
}

export async function listRssPosts(limit = 50): Promise<
  Pick<
    BlogPost,
    'slug' | 'title' | 'excerpt' | 'published_at' | 'updated_at' | 'cover_url'
  >[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, published_at, updated_at, cover_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as {
    slug: string
    title: string
    excerpt: string
    published_at: string | null
    updated_at: string
    cover_url: string | null
  }[]
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<BlogPostWithCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [enriched] = await attachCategories(
    supabase as unknown as SupabaseLike,
    [data as BlogPost]
  )
  return enriched as BlogPostWithCategory
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
// Admin reads/writes — posts (service role, bypass RLS)
// ============================================================

export async function adminListAllPosts(): Promise<BlogPostSummary[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select(POST_SUMMARY_COLUMNS)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as (Omit<BlogPost, 'content_md'>)[]
  const withCategory = await attachCategories(
    db as unknown as SupabaseLike,
    rows
  )
  return withCategory as BlogPostSummary[]
}

export async function adminGetPost(
  id: string
): Promise<BlogPostWithCategory | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [enriched] = await attachCategories(db as unknown as SupabaseLike, [
    data as BlogPost,
  ])
  return enriched as BlogPostWithCategory
}

export async function adminGetPostBySlug(
  slug: string
): Promise<BlogPostWithCategory | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const [enriched] = await attachCategories(db as unknown as SupabaseLike, [
    data as BlogPost,
  ])
  return enriched as BlogPostWithCategory
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

  // Swallow category_id if the column doesn't exist yet (migration
  // 023 not applied). Retry without the column on schema-cache
  // error so the admin can still create posts before running 023.
  const basePayload = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    cover_url: input.cover_url,
    content_md: input.content_md,
    status: input.status,
    author_id: authorId,
    published_at: publishedAt,
  }

  try {
    const { data, error } = await db
      .from('blog_posts')
      .insert({ ...basePayload, category_id: input.category_id })
      .select('*')
      .single()
    if (error) throw error
    return data as BlogPost
  } catch (e) {
    if (isColumnMissingError(e, 'category_id')) {
      const { data, error } = await db
        .from('blog_posts')
        .insert(basePayload)
        .select('*')
        .single()
      if (error) throw error
      return data as BlogPost
    }
    throw e
  }
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

  const basePayload = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    cover_url: input.cover_url,
    content_md: input.content_md,
    status: input.status,
    published_at: publishedAt,
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await db
      .from('blog_posts')
      .update({ ...basePayload, category_id: input.category_id })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as BlogPost
  } catch (e) {
    if (isColumnMissingError(e, 'category_id')) {
      const { data, error } = await db
        .from('blog_posts')
        .update(basePayload)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data as BlogPost
    }
    throw e
  }
}

function isColumnMissingError(e: unknown, column: string): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { code?: string; message?: string }
  // PostgREST returns PGRST204 for "column does not exist in schema
  // cache" and 42703 for the raw Postgres code.
  if (err.code !== 'PGRST204' && err.code !== '42703') return false
  return err.message?.includes(column) ?? false
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
  let counts = new Map<string, number>()
  try {
    const { data: posts, error: postErr } = await db
      .from('blog_posts')
      .select('category_id')
    if (postErr) throw postErr
    counts = new Map<string, number>()
    for (const p of posts ?? []) {
      const cid = (p as { category_id: string | null }).category_id
      if (cid) counts.set(cid, (counts.get(cid) ?? 0) + 1)
    }
  } catch (e) {
    // category_id column not yet applied → every count stays at 0.
    if (!isColumnMissingError(e, 'category_id')) throw e
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

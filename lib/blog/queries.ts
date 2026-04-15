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

import { randomBytes } from 'crypto'
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

export type BlogTag = {
  id: string
  slug: string
  name: string
  created_at: string
  updated_at: string
}

export type TagRef = Pick<BlogTag, 'id' | 'slug' | 'name'>

export type BlogAuthor = {
  id: string
  full_name: string | null
  avatar_url: string | null
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
  preview_token: string | null
  published_at: string | null
  views_count: number
  created_at: string
  updated_at: string
}

export type BlogPostWithCategory = BlogPost & {
  category: CategoryRef | null
  tags: TagRef[]
}
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
  'id, slug, title, excerpt, cover_url, status, author_id, category_id, preview_token, published_at, views_count, created_at, updated_at'

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

// Two-step tag fetch: junction first, then tags. Same fail-soft
// pattern as attachCategories so the blog keeps working before
// migration 024 is applied in a fresh env.
async function attachTags<T extends { id: string }>(
  db: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>,
  rows: T[]
): Promise<(T & { tags: TagRef[] })[]> {
  if (rows.length === 0) return []

  const postIds = rows.map((r) => r.id)

  try {
    const { data: links, error } = await db
      .from('blog_post_tags')
      .select('post_id, tag_id')
      .in('post_id', postIds)
    if (error) throw error

    const tagIds = Array.from(
      new Set((links ?? []).map((l) => (l as { tag_id: string }).tag_id))
    )
    if (tagIds.length === 0) {
      return rows.map((r) => ({ ...r, tags: [] as TagRef[] }))
    }

    const { data: tagsData, error: tagErr } = await db
      .from('blog_tags')
      .select('id, slug, name')
      .in('id', tagIds)
    if (tagErr) throw tagErr

    const tagMap = new Map<string, TagRef>()
    for (const t of (tagsData ?? []) as TagRef[]) {
      tagMap.set(t.id, t)
    }

    const postToTags = new Map<string, TagRef[]>()
    for (const raw of links ?? []) {
      const l = raw as { post_id: string; tag_id: string }
      const tag = tagMap.get(l.tag_id)
      if (!tag) continue
      const arr = postToTags.get(l.post_id) ?? []
      arr.push(tag)
      postToTags.set(l.post_id, arr)
    }

    return rows.map((r) => ({
      ...r,
      tags: postToTags.get(r.id) ?? [],
    }))
  } catch (e) {
    if (isMissingTableError(e)) {
      return rows.map((r) => ({ ...r, tags: [] as TagRef[] }))
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
// Public reads — tags
// ============================================================

export async function listTags(): Promise<BlogTag[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as BlogTag[]
  } catch (e) {
    if (isMissingTableError(e)) return []
    throw e
  }
}

export async function getTagBySlug(slug: string): Promise<BlogTag | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw error
    return (data as BlogTag | null) ?? null
  } catch (e) {
    if (isMissingTableError(e)) return null
    throw e
  }
}

// ============================================================
// Public reads — author (profiles)
// ============================================================

export async function getAuthorById(
  userId: string | null
): Promise<BlogAuthor | null> {
  if (!userId) return null
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return (data as BlogAuthor | null) ?? null
  } catch (e) {
    console.error('[getAuthorById] failed:', e)
    return null
  }
}

// ============================================================
// Public reads — blog posts
// ============================================================

function escapeIlike(input: string): string {
  return input.replace(/[%,()]/g, ' ').trim()
}

async function resolveTagFilterPostIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagSlug: string
): Promise<string[] | null> {
  const tag = await getTagBySlug(tagSlug)
  if (!tag) return null
  try {
    const { data, error } = await supabase
      .from('blog_post_tags')
      .select('post_id')
      .eq('tag_id', tag.id)
    if (error) throw error
    return (data ?? []).map((r) => (r as { post_id: string }).post_id)
  } catch (e) {
    if (isMissingTableError(e)) return null
    throw e
  }
}

export async function listPublishedPosts(params?: {
  limit?: number
  offset?: number
  categorySlug?: string
  tagSlug?: string
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

  let tagFilterPostIds: string[] | null = null
  if (params?.tagSlug) {
    tagFilterPostIds = await resolveTagFilterPostIds(supabase, params.tagSlug)
    if (tagFilterPostIds === null || tagFilterPostIds.length === 0) return []
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

  if (tagFilterPostIds) {
    query = query.in('id', tagFilterPostIds)
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
  const withTags = await attachTags(supabase, withCategory)
  return withTags as BlogPostSummary[]
}

export async function countPublishedPosts(params?: {
  categorySlug?: string
  tagSlug?: string
  searchQuery?: string
}): Promise<number> {
  const supabase = await createClient()

  let categoryFilterId: string | undefined
  if (params?.categorySlug) {
    const cat = await getCategoryBySlug(params.categorySlug)
    if (!cat) return 0
    categoryFilterId = cat.id
  }

  let tagFilterPostIds: string[] | null = null
  if (params?.tagSlug) {
    tagFilterPostIds = await resolveTagFilterPostIds(supabase, params.tagSlug)
    if (tagFilterPostIds === null || tagFilterPostIds.length === 0) return 0
  }

  let query = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (categoryFilterId) {
    query = query.eq('category_id', categoryFilterId)
  }

  if (tagFilterPostIds) {
    query = query.in('id', tagFilterPostIds)
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
  const withTags = await attachTags(supabase, withCategory)
  return withTags as BlogPostSummary[]
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

  const [withCategory] = await attachCategories(
    supabase as unknown as SupabaseLike,
    [data as BlogPost]
  )
  const [enriched] = await attachTags(supabase, [withCategory])
  return enriched as BlogPostWithCategory
}

// Public draft preview — looked up by a secret token. Uses the
// admin client so the preview can render even when status='draft'.
export async function getPostByPreviewToken(
  token: string
): Promise<BlogPostWithCategory | null> {
  if (!token || token.length < 8) return null
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('preview_token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const [withCategory] = await attachCategories(
    db as unknown as SupabaseLike,
    [data as BlogPost]
  )
  const [enriched] = await attachTags(db, [withCategory])
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
  const withTags = await attachTags(db, withCategory)
  return withTags as BlogPostSummary[]
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

  const [withCategory] = await attachCategories(db as unknown as SupabaseLike, [
    data as BlogPost,
  ])
  const [enriched] = await attachTags(db, [withCategory])
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

  const [withCategory] = await attachCategories(db as unknown as SupabaseLike, [
    data as BlogPost,
  ])
  const [enriched] = await attachTags(db, [withCategory])
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

// ============================================================
// Admin reads/writes — tags (service role, bypass RLS)
// ============================================================

export async function adminListTags(): Promise<
  (BlogTag & { post_count: number })[]
> {
  const db = createAdminClient()
  const { data: tags, error } = await db
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error

  const counts = new Map<string, number>()
  try {
    const { data: links, error: linkErr } = await db
      .from('blog_post_tags')
      .select('tag_id')
    if (linkErr) throw linkErr
    for (const l of links ?? []) {
      const tid = (l as { tag_id: string }).tag_id
      counts.set(tid, (counts.get(tid) ?? 0) + 1)
    }
  } catch (e) {
    if (!isMissingTableError(e)) throw e
  }

  return ((tags ?? []) as BlogTag[]).map((t) => ({
    ...t,
    post_count: counts.get(t.id) ?? 0,
  }))
}

export async function adminGetTagBySlug(slug: string): Promise<BlogTag | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_tags')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as BlogTag | null) ?? null
}

type TagUpsertInput = { slug: string; name: string }

export async function adminCreateTag(input: TagUpsertInput): Promise<BlogTag> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_tags')
    .insert({ slug: input.slug, name: input.name })
    .select('*')
    .single()
  if (error) throw error
  return data as BlogTag
}

export async function adminUpdateTag(
  id: string,
  input: TagUpsertInput
): Promise<BlogTag> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_tags')
    .update({
      slug: input.slug,
      name: input.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as BlogTag
}

export async function adminDeleteTag(id: string): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.from('blog_tags').delete().eq('id', id)
  if (error) throw error
}

// Replace the tag set for a post: delete existing junction rows,
// then insert new ones. No diff logic — at the scale we expect
// (a post has < 10 tags), a simple replace is cheaper to reason
// about than a merge.
export async function adminSetPostTags(
  postId: string,
  tagIds: string[]
): Promise<void> {
  const db = createAdminClient()
  const { error: delErr } = await db
    .from('blog_post_tags')
    .delete()
    .eq('post_id', postId)
  if (delErr) throw delErr

  if (tagIds.length === 0) return

  const rows = tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId }))
  const { error: insErr } = await db.from('blog_post_tags').insert(rows)
  if (insErr) throw insErr
}

// ============================================================
// Draft preview tokens
// ============================================================

function generatePreviewToken(): string {
  return randomBytes(16).toString('hex')
}

export async function adminEnsurePreviewToken(
  postId: string
): Promise<string> {
  const db = createAdminClient()
  const { data: existing, error: getErr } = await db
    .from('blog_posts')
    .select('preview_token')
    .eq('id', postId)
    .maybeSingle()
  if (getErr) throw getErr
  const current = (existing as { preview_token: string | null } | null)
    ?.preview_token
  if (current) return current

  const token = generatePreviewToken()
  const { error } = await db
    .from('blog_posts')
    .update({ preview_token: token })
    .eq('id', postId)
  if (error) throw error
  return token
}

export async function adminRotatePreviewToken(
  postId: string
): Promise<string> {
  const db = createAdminClient()
  const token = generatePreviewToken()
  const { error } = await db
    .from('blog_posts')
    .update({ preview_token: token })
    .eq('id', postId)
  if (error) throw error
  return token
}

export async function adminRevokePreviewToken(postId: string): Promise<void> {
  const db = createAdminClient()
  const { error } = await db
    .from('blog_posts')
    .update({ preview_token: null })
    .eq('id', postId)
  if (error) throw error
}

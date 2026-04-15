// Server-side blog queries. Public reads use the anon client so RLS
// applies (only 'published' rows visible). Admin CMS reads/writes go
// through the service-role admin client so drafts are visible and
// writes bypass RLS — super-admin gating happens in server actions.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  content_md: string
  status: 'draft' | 'published'
  author_id: string | null
  published_at: string | null
  views_count: number
  created_at: string
  updated_at: string
}

export type BlogPostSummary = Omit<BlogPost, 'content_md'>

// ============================================================
// Public reads
// ============================================================

export async function listPublishedPosts(params?: {
  limit?: number
  offset?: number
}): Promise<BlogPostSummary[]> {
  const supabase = await createClient()
  const limit = params?.limit ?? 20
  const offset = params?.offset ?? 0

  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, cover_url, status, author_id, published_at, views_count, created_at, updated_at'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data ?? []) as BlogPostSummary[]
}

export async function countPublishedPosts(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (error) throw error
  return count ?? 0
}

export async function getPublishedPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  return (data as BlogPost | null) ?? null
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
// Admin reads/writes (service role — bypass RLS)
// ============================================================

export async function adminListAllPosts(): Promise<BlogPostSummary[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, cover_url, status, author_id, published_at, views_count, created_at, updated_at'
    )
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as BlogPostSummary[]
}

export async function adminGetPost(id: string): Promise<BlogPost | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as BlogPost | null) ?? null
}

export async function adminGetPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return (data as BlogPost | null) ?? null
}

type UpsertInput = {
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  content_md: string
  status: 'draft' | 'published'
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

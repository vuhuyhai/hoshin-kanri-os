-- Platform-level blog. Authored by super-admin only, read publicly
-- when status = 'published'. Not tied to org_id: this is marketing
-- content for chienluoc.org, not per-tenant data.

create table if not exists blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  excerpt     text not null,
  cover_url   text,
  content_md  text not null,
  status      text not null default 'draft'
              check (status in ('draft', 'published')),
  author_id   uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  views_count int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_posts_status_published_at
  on blog_posts (status, published_at desc);

create index if not exists idx_blog_posts_slug on blog_posts (slug);

alter table blog_posts enable row level security;

-- Anyone (anon + authenticated) can read published posts.
create policy "public can read published blog posts"
  on blog_posts for select
  using (status = 'published');

-- Super-admin full read (including drafts) — authenticated path.
-- Admin CMS always goes through service-role client anyway, but this
-- policy keeps the user-context client useful for preview screens.
create policy "super_admin can read all blog posts"
  on blog_posts for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_super_admin = true
    )
  );

-- No INSERT/UPDATE/DELETE policies for authenticated/anon.
-- All writes go through service-role (createAdminClient) in server
-- actions after verifying is_super_admin. This mirrors the rate_limits
-- table pattern from migration 017.

create or replace function increment_blog_post_views(p_slug text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update blog_posts
    set views_count = views_count + 1
    where slug = p_slug and status = 'published'
    returning views_count into v_count;
  return coalesce(v_count, 0);
end;
$$;

revoke execute on function increment_blog_post_views(text) from public;
revoke execute on function increment_blog_post_views(text) from anon, authenticated;

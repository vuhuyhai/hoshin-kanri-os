-- Blog categories. One category per post (nullable — uncategorized is allowed).
-- Categories are platform-level like blog_posts; no org_id.

create table if not exists blog_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_categories_slug on blog_categories (slug);

alter table blog_categories enable row level security;

-- Public read — categories are metadata, safe to expose.
create policy "public can read blog categories"
  on blog_categories for select
  using (true);

-- No INSERT/UPDATE/DELETE policies — writes go through service-role
-- from /admin/blog/categories server actions after verifying
-- is_super_admin. Mirrors the blog_posts write pattern.

-- Add the FK column to blog_posts. Nullable so existing posts
-- stay uncategorized and survive deleting a category.
alter table blog_posts
  add column if not exists category_id uuid
  references blog_categories(id) on delete set null;

create index if not exists idx_blog_posts_category_id
  on blog_posts (category_id);

-- Blog tags. Many-to-many with blog_posts via a junction table.
-- Tags run parallel to categories: a post can have zero or one
-- category (already migrated in 023) AND zero-or-more tags.

create table if not exists blog_tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_blog_tags_slug on blog_tags (slug);

create table if not exists blog_post_tags (
  post_id    uuid not null references blog_posts(id) on delete cascade,
  tag_id     uuid not null references blog_tags(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create index if not exists idx_blog_post_tags_tag_id on blog_post_tags (tag_id);

alter table blog_tags       enable row level security;
alter table blog_post_tags  enable row level security;

create policy "public can read blog tags"
  on blog_tags for select
  using (true);

create policy "public can read blog post tags"
  on blog_post_tags for select
  using (true);

-- No INSERT/UPDATE/DELETE policies — all writes go through
-- service-role createAdminClient() after is_super_admin verification.

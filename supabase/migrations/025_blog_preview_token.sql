-- Draft preview tokens. Adds a per-post secret token that lets
-- super-admin share a preview URL for a draft post before publishing.
-- The token is nullable: rotated/revoked by setting it back to null.
-- A partial unique index keeps lookup O(1) and only covers non-null
-- rows so multiple drafts without a token don't collide.

alter table blog_posts
  add column if not exists preview_token text;

create unique index if not exists idx_blog_posts_preview_token
  on blog_posts (preview_token)
  where preview_token is not null;

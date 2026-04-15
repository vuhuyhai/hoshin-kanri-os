-- Newsletter subscribers. Lead capture for the blog CTA and any
-- other surface that collects emails at the platform level. Not
-- tied to an org — this is platform-wide marketing data.
--
-- Unique on lower(email) so case variants can't double-subscribe.
-- Reactivation of a previously unsubscribed email is handled by the
-- API route, not the DB — the route updates unsubscribed_at to null
-- when a user re-subscribes.

create table if not exists newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  source          text,
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists idx_newsletter_subscribers_email_lower
  on newsletter_subscribers (lower(email));

create index if not exists idx_newsletter_subscribers_created_at
  on newsletter_subscribers (created_at desc);

alter table newsletter_subscribers enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies. All reads and writes go
-- through service-role (createAdminClient) in server routes after
-- rate-limit checks. Mirrors the blog_posts write pattern.

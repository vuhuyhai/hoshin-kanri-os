create table evidence_cache (
  id          uuid primary key default gen_random_uuid(),
  cache_key   text unique not null,
  result_json jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index idx_evidence_cache_key     on evidence_cache(cache_key);
create index idx_evidence_cache_expires on evidence_cache(expires_at);

alter table evidence_cache enable row level security;
create policy "evidence_cache_all" on evidence_cache using (true) with check (true);

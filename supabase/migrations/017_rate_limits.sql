-- Rate limit buckets with atomic increment via RPC.
-- Server-only: accessed exclusively through service-role (admin client).

create table if not exists rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (bucket, window_start)
);

create index if not exists idx_rate_limits_window_start on rate_limits (window_start);

alter table rate_limits enable row level security;
-- No policies defined: anon/authenticated blocked entirely; service-role bypasses RLS.

create or replace function increment_rate_limit(
  p_bucket text,
  p_window_start timestamptz
) returns int
language plpgsql
as $$
declare
  v_count int;
begin
  insert into rate_limits (bucket, window_start, count)
  values (p_bucket, p_window_start, 1)
  on conflict (bucket, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;
  return v_count;
end;
$$;

revoke execute on function increment_rate_limit(text, timestamptz) from public;
revoke execute on function increment_rate_limit(text, timestamptz) from anon, authenticated;

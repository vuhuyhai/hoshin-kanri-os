-- Public storage bucket for blog cover images. Uploads go through
-- an authenticated admin API route (createAdminClient uses the
-- service role and bypasses storage RLS). We still add a narrow
-- public SELECT policy on storage.objects so the public URL pattern
-- works without signed URLs — cover images are not secret.

insert into storage.buckets (id, name, public)
values ('blog-covers', 'blog-covers', true)
on conflict (id) do nothing;

-- Public read. Writes are never allowed from anon/authenticated —
-- the admin API uses service_role which bypasses RLS entirely.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public can read blog-covers'
  ) then
    create policy "public can read blog-covers"
      on storage.objects for select
      using (bucket_id = 'blog-covers');
  end if;
end $$;

-- ============================================================
-- HOSHIN KANRI OS — Migration 028: Backfill public.users from auth.users
-- ============================================================
-- Root cause: Migration 011 updated handle_new_user() to insert into public.users,
-- but did not backfill auth users created before that trigger update. Those users
-- had auth.users + profiles but no public.users row, so org_members INSERT during
-- onboarding failed FK `org_members_user_id_fkey`.
--
-- Idempotent: ON CONFLICT DO NOTHING. Safe to re-run.

INSERT INTO public.users (id, email, full_name, phone, created_at)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'phone',
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

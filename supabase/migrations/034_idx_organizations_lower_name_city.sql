-- Functional index for case-insensitive org name + city lookup
-- Used by /api/orgs/check-similar for duplicate detection on onboarding
-- Applied via Supabase dashboard 2026-05-01 (M-OrgUX-1)
-- Backfilled to repo 2026-05-08 (M-Cleanup-5) for git revert safety

create index if not exists idx_organizations_lower_name_city
on organizations (lower(name), lower(city));

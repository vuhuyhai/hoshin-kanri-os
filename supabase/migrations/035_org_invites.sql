-- Migration 035: org_invites table for CEO invite link flow
-- Invite lifecycle: pending → accepted (accepted_at set) or expired (expires_at < now())

create type public.invite_role as enum ('Manager', 'Member');

create table public.org_invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  invited_by    uuid not null references auth.users(id) on delete cascade,
  email         text not null,
  role          public.invite_role not null default 'Member',
  token         uuid not null unique default gen_random_uuid(),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  accepted_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Indexes
create index idx_org_invites_org_id     on public.org_invites(org_id);
create index idx_org_invites_token      on public.org_invites(token);
create index idx_org_invites_email      on public.org_invites(email);

-- RLS
alter table public.org_invites enable row level security;

-- CEO/Manager của org: xem danh sách invites org mình
create policy "org_invites_select" on public.org_invites
  for select using (
    exists (
      select 1 from public.org_members
      where org_members.org_id = org_invites.org_id
        and org_members.user_id = auth.uid()
        and org_members.role in ('CEO', 'Manager')
    )
  );

-- CEO only: tạo invite
create policy "org_invites_insert" on public.org_invites
  for insert with check (
    exists (
      select 1 from public.org_members
      where org_members.org_id = org_invites.org_id
        and org_members.user_id = auth.uid()
        and org_members.role = 'CEO'
    )
  );

-- CEO only: xóa (revoke) invite chưa accepted
create policy "org_invites_delete" on public.org_invites
  for delete using (
    accepted_at is null
    and exists (
      select 1 from public.org_members
      where org_members.org_id = org_invites.org_id
        and org_members.user_id = auth.uid()
        and org_members.role = 'CEO'
    )
  );

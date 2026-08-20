-- ---------------------------------------------------------------------------
-- Phase 7 — Contact / "Let's Work Together"
--
-- Public form writes here; only the signed-in admin can read or triage.
-- Safe to re-run (idempotent).
-- ---------------------------------------------------------------------------

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null check (char_length(trim(name)) between 2 and 120),
  email      text        not null check (char_length(email) between 3 and 320),
  message    text        not null check (char_length(trim(message)) between 10 and 5000),
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- The admin list is always "newest first", optionally filtered to unread.
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc) where read = false;

alter table public.contact_messages enable row level security;

-- Anyone may submit the public contact form...
drop policy if exists "contact_messages: anon insert" on public.contact_messages;
create policy "contact_messages: anon insert"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- ...but reading/triaging is admin-only. There is exactly one admin user, so
-- "any authenticated session" is the correct audience here.
drop policy if exists "contact_messages: admin select" on public.contact_messages;
create policy "contact_messages: admin select"
  on public.contact_messages
  for select
  to authenticated
  using (true);

drop policy if exists "contact_messages: admin update" on public.contact_messages;
create policy "contact_messages: admin update"
  on public.contact_messages
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "contact_messages: admin delete" on public.contact_messages;
create policy "contact_messages: admin delete"
  on public.contact_messages
  for delete
  to authenticated
  using (true);

-- Deliberately NOT granted: anon select/update/delete. An unauthenticated
-- client can write a message and nothing else.

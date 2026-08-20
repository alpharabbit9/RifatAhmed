-- ---------------------------------------------------------------------------
-- Phase 8 — Footer
--
-- `social_links` powers the footer's Connect column; the `resume` storage
-- bucket holds the downloadable CV. Safe to re-run (idempotent).
-- ---------------------------------------------------------------------------

create table if not exists public.social_links (
  id            uuid primary key default gen_random_uuid(),
  platform      text    not null check (char_length(trim(platform)) between 1 and 60),
  url           text    not null check (char_length(url) between 3 and 2048),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists social_links_display_order_idx
  on public.social_links (display_order asc, created_at asc);

alter table public.social_links enable row level security;

-- Public read — the footer renders for logged-out visitors.
drop policy if exists "social_links: public read" on public.social_links;
create policy "social_links: public read"
  on public.social_links
  for select
  to anon, authenticated
  using (true);

drop policy if exists "social_links: admin write" on public.social_links;
create policy "social_links: admin write"
  on public.social_links
  for all
  to authenticated
  using (true)
  with check (true);


-- --- Resume storage bucket -------------------------------------------------
-- Public read so the footer's "Download Resume" link works without a signed
-- URL; writes are admin-only. The app always uploads to the fixed object key
-- `rifat-ahmed-resume.pdf` (upsert), so the public URL is stable and the
-- footer can resolve it without a database column.

insert into storage.buckets (id, name, public)
values ('resume', 'resume', true)
on conflict (id) do nothing;

drop policy if exists "resume: public read" on storage.objects;
create policy "resume: public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'resume');

drop policy if exists "resume: admin write" on storage.objects;
create policy "resume: admin write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'resume')
  with check (bucket_id = 'resume');

-- ---------------------------------------------------------------------------
-- Phase 5 — Career Journey (timeline)
--
-- Two tables:
--
--   career_section  singleton row — the section's eyebrow/heading/standfirst,
--                   so the header copy is editable like the About section's.
--   career_journey  one row per role, newest first by display_order.
--
-- Company logos live in the existing `media` bucket (created by
-- `0004_projects.sql`) under `career/<entry-id>/…`; the bucket is re-asserted
-- below so this file also works on a database that skipped Phase 4.
--
-- Dates are stored as `date` at month precision (`YYYY-MM-01`) — the admin
-- form uses <input type="month"> and the public timeline renders "Jan 2023".
-- Both are nullable: a role whose dates aren't filled in yet renders without a
-- period rather than blocking the entry.
--
-- Safe to re-run: every DDL statement is guarded and every seed is
-- conditional, so applying this twice changes nothing.
-- ---------------------------------------------------------------------------

/* --- career_section ------------------------------------------------------- */

create table if not exists public.career_section (
  id          uuid primary key default gen_random_uuid(),
  -- Singleton guard: always true, unique, so a second row can't be inserted.
  singleton   boolean not null default true,
  eyebrow     text not null default 'Career Journey',
  heading     text not null default 'Where I have worked',
  standfirst  text not null default '',
  updated_at  timestamptz not null default now(),
  constraint career_section_singleton_unique unique (singleton),
  constraint career_section_singleton_true check (singleton)
);

/* --- career_journey ------------------------------------------------------- */

create table if not exists public.career_journey (
  id                uuid primary key default gen_random_uuid(),
  role              text not null check (char_length(trim(role)) between 1 and 160),
  company           text not null check (char_length(trim(company)) between 1 and 160),
  company_url       text check (company_url is null or char_length(company_url) between 3 and 2048),
  -- "Full-time", "Part-time", "Contract", "Internship", "Freelance" — freeform
  -- underneath, the admin picks from suggestions.
  employment_type   text not null default '',
  location          text not null default '',
  -- Month precision: always the 1st of the month. NULL end_date = current role.
  start_date        date,
  end_date          date,
  description       text not null default '',
  -- Bullet points under the description — one line each in the admin form.
  highlights        text[] not null default '{}',
  -- Pills at the foot of the card ("Social Media Management", …).
  skills            text[] not null default '{}',
  -- Public URL of the company logo (uploaded to `media`, or a path in /public).
  logo_url          text,
  -- Storage key, so replacing/deleting an entry can clean the bucket up.
  logo_storage_path text,
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint career_journey_date_range
    check (start_date is null or end_date is null or end_date >= start_date)
);

create index if not exists career_journey_display_order_idx
  on public.career_journey (display_order asc, created_at asc);

/* --- RLS ------------------------------------------------------------------ */
-- Public (anon) read — this is published content. Writes are admin-only.

alter table public.career_section enable row level security;
alter table public.career_journey enable row level security;

do $policies$
declare
  t text;
begin
  foreach t in array array['career_section', 'career_journey'] loop
    execute format('drop policy if exists %I on public.%I', t || ': public read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || ': public read', t
    );

    execute format('drop policy if exists %I on public.%I', t || ': admin write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || ': admin write', t
    );
  end loop;
end
$policies$;

/* --- Media storage bucket (re-assert; owned by 0004) ---------------------- */
-- Public read so <Image> can load a logo without a signed URL; writes are
-- admin-only. Career uploads are keyed `career/<entry-id>/<timestamp>-<name>`.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media: public read" on storage.objects;
create policy "media: public read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "media: admin write" on storage.objects;
create policy "media: admin write"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

/* --- Seed: section copy --------------------------------------------------- */

insert into public.career_section (eyebrow, heading, standfirst)
select
  'Career Journey',
  'Where I have worked',
  'The roles behind the work — what each company does, what I owned there, and what I took with me.'
where not exists (select 1 from public.career_section);

/* --- Seed: the first entry ------------------------------------------------ */
-- NOTE: the dates below are placeholders. Correct them (and everything else on
-- this row) at /admin/career-journey — nothing here is hardcoded in the app.

insert into public.career_journey (
  role, company, employment_type, location,
  start_date, end_date, description, highlights, skills,
  logo_url, display_order
)
select
  'Administrator & Social Media Manager',
  'Samstop UK LTD',
  'Full-time',
  'United Kingdom · Remote',
  date '2023-01-01',
  date '2024-12-01',
  'Samstop UK LTD is a consultancy and UK sponsorship company that guides international candidates and employers through the visa sponsorship process. I ran the day-to-day administration alongside the company''s social media presence.',
  array[
    'Handled day-to-day administration — client records, document checks and correspondence across live sponsorship applications.',
    'Owned the social media presence end to end: content calendar, copywriting, scheduling and community replies.',
    'Kept applicant case files organised and current, so any consultant could pick up a case without a handover.',
    'Triaged inbound enquiries from email and social channels and routed qualified leads to the consultancy team.'
  ],
  array[
    'Administration',
    'Social Media Management',
    'Content Strategy',
    'Client Communication',
    'Document Management',
    'Reporting'
  ],
  '/logos/samstop-uk.svg',
  0
where not exists (
  select 1 from public.career_journey where lower(company) = 'samstop uk ltd'
);

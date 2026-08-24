-- ---------------------------------------------------------------------------
-- Phase 7 — Achievements / Certificates ("the gallery wall")
--
-- Two tables, the same shape Phases 5 and 6 established:
--
--   achievements_section  singleton row — the eyebrow, the display heading and
--                         the standfirst, so every word of the chapter is
--                         editable without a redeploy.
--   achievements          one row per certificate, hung left-to-right by
--                         display_order.
--
-- Two columns are worth explaining, because neither is obvious from the name:
--
--   · `heading_accent` — the section heading is one string ("Certificates that
--     reflect growth."), and the design sets part of it in burgundy. Rather
--     than storing two half-headings that could drift out of sync, the accent
--     is stored as the *substring* to highlight; the public section
--     case-insensitively finds it and wraps it. An accent that no longer
--     occurs in the heading simply doesn't highlight — it never corrupts the
--     words on screen.
--
--   · `image_url` is nullable, and a null is a supported state rather than a
--     hole. A certificate with no scan uploaded renders as a typeset plate
--     inside its frame (title / issuer / date set on cream), which is what
--     makes the wall look finished before a single JPEG exists. See
--     `features/achievements/certificate-frame.tsx`.
--
-- `issued_on` is a real `date` (always the 1st of the month) rather than the
-- free text "May 2024" the brief sketched: the admin picks a month, the site
-- formats it, and the rows can be ordered by it later without parsing prose.
--
-- Safe to re-run: every DDL statement is guarded and every seed is
-- conditional, so applying this twice changes nothing.
-- ---------------------------------------------------------------------------

/* --- achievements_section ------------------------------------------------- */

create table if not exists public.achievements_section (
  id          uuid primary key default gen_random_uuid(),
  -- Singleton guard: always true, unique, so a second row can't be inserted.
  singleton   boolean not null default true,
  eyebrow     text not null default 'My Achievements',
  heading     text not null default 'Certificates that reflect growth.',
  -- The words inside `heading` set in burgundy. Blank = no highlight.
  heading_accent text not null default 'that reflect',
  standfirst  text not null default '',
  updated_at  timestamptz not null default now(),
  constraint achievements_section_singleton_unique unique (singleton),
  constraint achievements_section_singleton_true check (singleton)
);

/* --- achievements --------------------------------------------------------- */

create table if not exists public.achievements (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(trim(title)) between 1 and 140),
  -- Who awarded it — "Google Cloud", "Meta", "freeCodeCamp".
  issuer             text not null default '',
  -- One word on the placard and in the viewer: "Cloud", "Frontend", "AI".
  category           text not null default '',
  -- Always the 1st of the month; the site renders "May 2024". Null hides it.
  issued_on          date,
  -- Optional "View credential" link in the viewer. Blank hides the button.
  credential_url     text not null default '',
  -- The scan itself. Null renders the typeset plate instead (see above).
  image_url          text,
  -- Key inside the `media` bucket, kept so a replaced scan can be deleted.
  image_storage_path text,
  display_order      integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists achievements_display_order_idx
  on public.achievements (display_order asc, created_at asc);

/* --- RLS ------------------------------------------------------------------ */
-- Public (anon) read — this is published content. Writes are admin-only.

alter table public.achievements_section enable row level security;
alter table public.achievements enable row level security;

do $policies$
declare
  t text;
begin
  foreach t in array array['achievements_section', 'achievements'] loop
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
-- Certificate scans live under `achievements/…` in the same public bucket the
-- project, career and hero images use. Re-asserted here so this file can be
-- applied on its own.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

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
-- Mirrors DEFAULT_ACHIEVEMENTS_SECTION in features/achievements/data.ts, which
-- is what the public wall renders until this file has been applied.

insert into public.achievements_section (eyebrow, heading, heading_accent, standfirst)
select
  'My Achievements',
  'Certificates that reflect growth.',
  'that reflect',
  'A collection of certifications and achievements that represent continuous learning, dedication, and skill development.'
where not exists (select 1 from public.achievements_section);

-- ---------------------------------------------------------------------------
-- Phase 1 — Hero / Profile
--
-- The singleton `profile` row PLAN.md §"Data model" reserved for the Hero
-- phase. The Footer phase already reads it opportunistically:
--
--   · features/footer/data.ts    → profile.resume_file_url (CV download)
--   · features/footer/actions.ts → writes resume_file_url back on upload
--
-- so this migration is what turns those "the Hero phase may not exist yet"
-- fallbacks into live data. Nothing here renames a column another phase
-- already depends on.
--
-- The schema is wider than PLAN.md's sketch (`name`, `tagline`,
-- `role_labels`, `bio`, `portrait_image_url`, `logo_url`, `resume_file_url`)
-- because the hero that got built carries more admin-editable surface than
-- the sketch assumed: two CTAs, the rolling quote block, the brush artwork
-- behind the portrait, and a storage path per uploaded image so a replaced
-- file can be cleaned out of the bucket. Every column from the sketch is
-- still here under its original name.
--
-- Safe to re-run: every DDL statement is guarded and the seed is conditional.
-- ---------------------------------------------------------------------------

/* --- profile -------------------------------------------------------------- */

create table if not exists public.profile (
  id                    uuid primary key default gen_random_uuid(),
  -- Singleton guard: always true, unique, so a second row can't be inserted.
  singleton             boolean not null default true,

  -- One display line per newline. The hero renders line 1 in cream and every
  -- following line in burgundy, each as its own extruded stack.
  name                  text not null default E'Rifat\nAhmed',
  -- The eyebrow above the name. More than one cycles through a single slot.
  role_labels           text[] not null default array['Full Stack Developer', 'AI Agent Builder'],
  -- The large statement under the name.
  tagline               text not null default 'Building products & AI agents that make an impact.',
  -- The short introduction beside the burgundy rule.
  bio                   text not null default '',

  -- The rolling quote block in the right-hand editorial column. Empty hides it.
  quote_words           text[] not null default array['Code.', 'Create.', 'Automate.', 'Repeat.'],
  -- Label above the social row. Blank hides the label, not the row.
  connect_label         text not null default 'Let''s Connect',

  -- Primary CTA (the sweep button).
  cta_label             text not null default 'View My Work',
  cta_href              text not null default '#projects',
  -- Contact CTA — PLAN.md §"Confirmed decisions": the hero serves recruiters
  -- and clients equally, so it needs a contact route as well as the resume.
  contact_cta_label     text not null default 'Let''s Talk',
  contact_cta_href      text not null default '#contact',
  -- Resume CTA. The URL comes from `resume_file_url` (or the storage-bucket
  -- fallback in features/footer/data.ts); this is only its label, and the
  -- link hides itself when no CV has been uploaded.
  resume_cta_label      text not null default 'Download CV',

  -- Media. `*_storage_path` is the key inside the `media` bucket, kept so a
  -- replaced image can be removed; null means "the file that ships with the
  -- repo", which has no key to delete.
  portrait_image_url    text,
  portrait_storage_path text,
  artwork_image_url     text,
  artwork_storage_path  text,
  logo_url              text,
  logo_storage_path     text,

  -- Written by the Footer phase's resume upload as well as by /admin/hero.
  resume_file_url       text,

  updated_at            timestamptz not null default now(),

  constraint profile_singleton_unique unique (singleton),
  constraint profile_singleton_true check (singleton)
);

-- Columns added after an earlier hand-run of this file (or by another phase
-- creating a bare `profile`) — each is a no-op when it already exists.
alter table public.profile add column if not exists role_labels           text[] not null default array['Full Stack Developer', 'AI Agent Builder'];
alter table public.profile add column if not exists quote_words           text[] not null default array['Code.', 'Create.', 'Automate.', 'Repeat.'];
alter table public.profile add column if not exists connect_label         text not null default 'Let''s Connect';
alter table public.profile add column if not exists cta_label             text not null default 'View My Work';
alter table public.profile add column if not exists cta_href              text not null default '#projects';
alter table public.profile add column if not exists contact_cta_label     text not null default 'Let''s Talk';
alter table public.profile add column if not exists contact_cta_href      text not null default '#contact';
alter table public.profile add column if not exists resume_cta_label      text not null default 'Download CV';
alter table public.profile add column if not exists portrait_image_url    text;
alter table public.profile add column if not exists portrait_storage_path text;
alter table public.profile add column if not exists artwork_image_url     text;
alter table public.profile add column if not exists artwork_storage_path  text;
alter table public.profile add column if not exists logo_url              text;
alter table public.profile add column if not exists logo_storage_path     text;
alter table public.profile add column if not exists resume_file_url       text;

/* --- RLS ------------------------------------------------------------------ */
-- Public (anon) read — this is published content. Writes are restricted to
-- the authenticated admin, matching every other section.

alter table public.profile enable row level security;

drop policy if exists "profile: public read" on public.profile;
create policy "profile: public read"
  on public.profile
  for select
  to anon, authenticated
  using (true);

drop policy if exists "profile: admin write" on public.profile;
create policy "profile: admin write"
  on public.profile
  for all
  to authenticated
  using (true)
  with check (true);

/* --- Media storage bucket (re-assert; owned by 0004) ---------------------- */
-- Hero images live under `hero/…` in the same public bucket the project and
-- career images use. Re-asserted here so this file can be applied on its own.

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

/* --- Seed: the live copy -------------------------------------------------- */
-- Mirrors DEFAULT_PROFILE in features/hero/data.ts, which is what the public
-- hero renders until this file has been applied. Seeding the same words means
-- applying it changes nothing on screen — it only makes the words editable.

insert into public.profile (name, role_labels, tagline, bio)
select
  E'Rifat\nAhmed',
  array['Full Stack Developer', 'AI Agent Builder'],
  'Building products & AI agents that make an impact.',
  'Full Stack Developer & AI Agent Builder passionate about creating modern web apps, smart automations and meaningful digital experiences.'
where not exists (select 1 from public.profile);

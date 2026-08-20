-- ---------------------------------------------------------------------------
-- Phase 4 — Projects
--
-- Two tables plus one storage bucket:
--
--   projects        one row per case study (copy, tech stack, features, meta)
--   project_images  the uploaded gallery; one of them is flagged as the
--                   showcase image via projects.showcase_image_id
--   storage.media   the bucket those images live in (public read)
--
-- `features` is JSONB rather than a child table: features are only ever
-- edited inside the project form (never reordered independently, never
-- queried on their own), so a nested array keeps the admin save to a single
-- round trip. Images ARE a child table — they are uploaded and deleted one at
-- a time, and the showcase flag needs a stable id to point at.
--
-- Safe to re-run: every statement is guarded and the seed is conditional.
-- ---------------------------------------------------------------------------

/* --- projects ------------------------------------------------------------- */

create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  -- Drives /projects/<slug>; generated from the title, editable by hand.
  slug             text not null unique check (char_length(trim(slug)) between 1 and 80),
  title            text not null check (char_length(trim(title)) between 1 and 120),
  -- Uppercase kicker under the title — "AI-POWERED RESUME BUILDER".
  subtitle         text not null default '',
  description      text not null default '',
  -- Freeform, but the admin picks from suggestions ("AI Agent", "Full Stack").
  category         text not null default 'Full Stack'
                     check (char_length(trim(category)) between 1 and 60),
  technologies     text[] not null default '{}',
  -- [{ "icon": "brain", "title": "…", "description": "…" }, …]
  -- `icon` is a key from features/projects/icons.ts (allow-listed in the
  -- server action, so a bad value can never reach the public site).
  features         jsonb  not null default '[]'::jsonb,
  year             text not null default '',
  role             text not null default '',
  live_demo_url    text,
  source_code_url  text,
  status           text not null default 'draft'
                     check (status in ('draft', 'published')),
  featured         boolean not null default true,
  display_order    integer not null default 0,
  -- Set after the images are inserted (see the FK block below).
  showcase_image_id uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint projects_features_is_array check (jsonb_typeof(features) = 'array')
);

create index if not exists projects_display_order_idx
  on public.projects (display_order asc, created_at desc);

create index if not exists projects_status_idx
  on public.projects (status);

/* --- project_images ------------------------------------------------------- */

create table if not exists public.project_images (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  url           text not null check (char_length(url) between 3 and 2048),
  -- Object key inside the `media` bucket, so a delete can remove the file too.
  storage_path  text,
  alt           text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists project_images_project_order_idx
  on public.project_images (project_id, display_order asc, created_at asc);

-- Circular reference (projects → images → projects), so the FK is added after
-- both tables exist. `on delete set null`: removing the showcase image leaves
-- the project intact, just without a chosen shot.
do $showcase_fk$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_showcase_image_fk'
  ) then
    alter table public.projects
      add constraint projects_showcase_image_fk
      foreign key (showcase_image_id)
      references public.project_images (id)
      on delete set null;
  end if;
end
$showcase_fk$;

/* --- RLS ------------------------------------------------------------------ */
-- Anonymous visitors see published projects only; drafts stay admin-only.

alter table public.projects       enable row level security;
alter table public.project_images enable row level security;

drop policy if exists "projects: public read published" on public.projects;
create policy "projects: public read published"
  on public.projects
  for select
  to anon
  using (status = 'published');

drop policy if exists "projects: admin all" on public.projects;
create policy "projects: admin all"
  on public.projects
  for all
  to authenticated
  using (true)
  with check (true);

-- Images inherit their parent's visibility.
drop policy if exists "project_images: public read published" on public.project_images;
create policy "project_images: public read published"
  on public.project_images
  for select
  to anon
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_images.project_id
        and p.status = 'published'
    )
  );

drop policy if exists "project_images: admin all" on public.project_images;
create policy "project_images: admin all"
  on public.project_images
  for all
  to authenticated
  using (true)
  with check (true);

/* --- Media storage bucket -------------------------------------------------- */
-- Public read so <Image> can load screenshots without a signed URL; writes are
-- admin-only. Uploads are keyed `projects/<project-id>/<timestamp>-<name>`.

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

/* --- Seed: CareerLogic AI -------------------------------------------------- */
-- Mirrors the fallback in features/projects/projects.ts so the section looks
-- the same before and after the first admin edit. Screenshots are uploaded
-- through /admin/projects, so this row starts without one.

insert into public.projects (
  slug, title, subtitle, description, category, technologies, features,
  year, role, live_demo_url, status, featured, display_order
)
select
  'careerlogic-ai',
  'CareerLogic AI',
  'AI-Powered Resume Builder',
  'An AI powered platform that analyzes, tailors and optimizes resumes to help users land their dream jobs faster with intelligent insights.',
  'AI Agent',
  array['React', 'Next.js', 'Node.js', 'MongoDB', 'Tailwind CSS'],
  '[
     {"icon": "brain",    "title": "AI Analysis",      "description": "Resume scoring & smart insights"},
     {"icon": "file",     "title": "Resume Tailoring", "description": "Custom resumes for every job role"},
     {"icon": "download", "title": "Easy Export",      "description": "Download ATS friendly resumes"}
   ]'::jsonb,
  '2025',
  'Full Stack Developer',
  'https://careerlogicai.vercel.app',
  'published',
  true,
  0
where not exists (select 1 from public.projects);

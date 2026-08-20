-- ---------------------------------------------------------------------------
-- Phase 2 — About Me (narrative + education + tech stack)
--
-- The public site renders all of this as ONE section (`#about`): the story,
-- the education card, then the categorised capability groups. Four tables:
--
--   about         singleton row — headings + body copy
--   education     degrees, ordered by display_order
--   skill_groups  "Frontend & Interactive Experiences", …
--   skills        the individual pills inside a group
--
-- Safe to re-run: every DDL statement is guarded and every seed is
-- conditional, so applying this twice changes nothing.
-- ---------------------------------------------------------------------------

/* --- about ---------------------------------------------------------------- */

create table if not exists public.about (
  id             uuid primary key default gen_random_uuid(),
  -- Singleton guard: always true, unique, so a second row can't be inserted.
  singleton      boolean not null default true,
  eyebrow        text not null default 'About Me',
  -- One display line per newline — the public heading stacks them.
  heading        text not null default E'Build.\nSolve.\nLearn.',
  -- Paragraphs separated by a blank line. `**bold**` renders as a highlighted
  -- span; no other markup is interpreted.
  body           text not null default '',
  stack_eyebrow  text not null default 'Tech Stack',
  stack_heading  text not null default 'What I build with',
  stack_body     text not null default '',
  updated_at     timestamptz not null default now(),
  constraint about_singleton_unique unique (singleton),
  constraint about_singleton_true check (singleton)
);

/* --- education ------------------------------------------------------------ */

create table if not exists public.education (
  id            uuid primary key default gen_random_uuid(),
  degree        text not null check (char_length(trim(degree)) between 1 and 160),
  institution   text not null check (char_length(trim(institution)) between 1 and 160),
  timeframe     text,
  note          text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists education_display_order_idx
  on public.education (display_order asc, created_at asc);

/* --- skill_groups --------------------------------------------------------- */

create table if not exists public.skill_groups (
  id            uuid primary key default gen_random_uuid(),
  -- Stable handle used by the seeds below (keeps re-runs idempotent).
  slug          text not null unique check (char_length(trim(slug)) between 1 and 60),
  title         text not null check (char_length(trim(title)) between 1 and 120),
  summary       text,
  -- Lucide identifier from the allow-list in features/about/icons.ts (§23).
  icon_name     text not null default 'sparkles',
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists skill_groups_display_order_idx
  on public.skill_groups (display_order asc, created_at asc);

/* --- skills --------------------------------------------------------------- */

create table if not exists public.skills (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.skill_groups (id) on delete cascade,
  label         text not null check (char_length(trim(label)) between 1 and 60),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists skills_group_order_idx
  on public.skills (group_id, display_order asc, created_at asc);

/* --- RLS ------------------------------------------------------------------ */
-- Public (anon) read everywhere — this is published content. Writes are
-- restricted to the authenticated admin.

alter table public.about        enable row level security;
alter table public.education    enable row level security;
alter table public.skill_groups enable row level security;
alter table public.skills       enable row level security;

do $policies$
declare
  t text;
begin
  foreach t in array array['about', 'education', 'skill_groups', 'skills'] loop
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

/* --- Seed: the live copy -------------------------------------------------- */

insert into public.about (eyebrow, heading, body, stack_eyebrow, stack_heading, stack_body)
select
  'About Me',
  E'Build.\nSolve.\nLearn.',
  E'I am **Rifat Ahmed**, a CSE student and Full-Stack Developer passionate about building modern web applications and **AI-powered systems**.\n\nI enjoy turning ideas into intuitive, well-designed products using **React, Next.js, Node.js**, and modern technologies. Currently I am exploring **AI Agents, RAG, MCP, machine learning, and workflow automation** to build intelligent solutions for real-world problems.',
  'Tech Stack',
  'What I build with',
  'Three layers of the same craft — the interface people touch, the systems behind it, and the intelligence wired through both.'
where not exists (select 1 from public.about);

insert into public.education (degree, institution, timeframe, note, display_order)
select
  'BSc in Computer Science and Engineering',
  'Leading University',
  null,
  null,
  0
where not exists (select 1 from public.education);

insert into public.skill_groups (slug, title, summary, icon_name, display_order)
values
  ('frontend', 'Frontend & Interactive Experiences', 'Interfaces that feel fast, considered and alive — design systems through to 3D.', 'layers',   0),
  ('backend',  'Backend & Databases',                'APIs, schemas and auth built to hold up once real traffic arrives.',              'database', 1),
  ('ai',       'AI & Intelligent Systems',           'Agents, retrieval and automation wired into products that actually ship.',        'sparkles', 2)
on conflict (slug) do nothing;

insert into public.skills (group_id, label, display_order)
select g.id, seed.label, seed.ord
from public.skill_groups g
join (
  values
    ('frontend', 'React',            0),
    ('frontend', 'Next.js',          1),
    ('frontend', 'TypeScript',       2),
    ('frontend', 'JavaScript',       3),
    ('frontend', 'Tailwind CSS',     4),
    ('frontend', 'Three.js',         5),
    ('frontend', 'Zustand',          6),
    ('frontend', 'ShadCN UI',        7),
    ('backend',  'Node.js',          0),
    ('backend',  'Express.js',       1),
    ('backend',  'REST APIs',        2),
    ('backend',  'Prisma',           3),
    ('backend',  'PostgreSQL',       4),
    ('backend',  'MongoDB',          5),
    ('backend',  'Supabase',         6),
    ('ai',       'N8N',              0),
    ('ai',       'AI Agents',        1),
    ('ai',       'RAG',              2),
    ('ai',       'MCP',              3),
    ('ai',       'LangChain',        4),
    ('ai',       'Vector Databases', 5)
) as seed (slug, label, ord) on seed.slug = g.slug
where not exists (
  select 1
  from public.skills s
  where s.group_id = g.id and lower(s.label) = lower(seed.label)
);

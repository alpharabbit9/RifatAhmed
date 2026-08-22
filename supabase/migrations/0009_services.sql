-- ---------------------------------------------------------------------------
-- Phase 6 — Services ("What I can build for you")
--
-- Two tables, the same shape Phase 5 established for the timeline:
--
--   services_section  singleton row — the section's eyebrow/heading/standfirst
--                     plus the one call-to-action under the list, so every
--                     word of the chapter is editable without a redeploy.
--   services          one row per offer, rendered top to bottom by
--                     display_order.
--
-- Schema note (PLAN.md asked for this to be confirmed at build time rather
-- than up front): the assumed shape was `title` / `short_description` /
-- `icon_name` / `display_order`. Two additions survived contact with the
-- layout —
--
--   · `deliverables text[]` — a service that only states a title and a
--     sentence gives a client nothing to say yes to. The public row lists what
--     is actually handed over.
--   · a section-level CTA on `services_section` rather than a per-service one:
--     every offer ends at the same contact form, so four buttons would be four
--     copies of one link.
--
-- `icon_name` is a key from `features/services/icons.ts`, not a free-text
-- Lucide name — the admin picks from the allow-list, and an unknown key
-- degrades to a neutral glyph instead of a blank square.
--
-- Safe to re-run: every DDL statement is guarded and every seed is
-- conditional, so applying this twice changes nothing.
-- ---------------------------------------------------------------------------

/* --- services_section ----------------------------------------------------- */

create table if not exists public.services_section (
  id          uuid primary key default gen_random_uuid(),
  -- Singleton guard: always true, unique, so a second row can't be inserted.
  singleton   boolean not null default true,
  eyebrow     text not null default 'Services',
  heading     text not null default 'What I can build for you',
  standfirst  text not null default '',
  -- The closing line beside the CTA. Blank hides it.
  cta_note    text not null default '',
  -- The single CTA under the list. Blank label hides it entirely.
  cta_label   text not null default 'Start a project',
  cta_href    text not null default '#contact',
  updated_at  timestamptz not null default now(),
  constraint services_section_singleton_unique unique (singleton),
  constraint services_section_singleton_true check (singleton)
);

/* --- services ------------------------------------------------------------- */

create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(trim(title)) between 1 and 120),
  -- One paragraph under the title — what the service is, in the client's terms.
  summary       text not null default '',
  -- Allow-list key (features/services/icons.ts), e.g. 'bot', 'code'.
  icon_name     text not null default 'sparkles',
  -- What the client actually receives. Rendered as the list beside the summary.
  deliverables  text[] not null default '{}',
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists services_display_order_idx
  on public.services (display_order asc, created_at asc);

/* --- RLS ------------------------------------------------------------------ */
-- Public (anon) read — this is published content. Writes are admin-only.

alter table public.services_section enable row level security;
alter table public.services enable row level security;

do $policies$
declare
  t text;
begin
  foreach t in array array['services_section', 'services'] loop
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

/* --- Seed: section copy --------------------------------------------------- */

insert into public.services_section (eyebrow, heading, standfirst, cta_note, cta_label, cta_href)
select
  'Services',
  'What I can build for you',
  'Four ways I usually come into a project — from a product built end to end, to an agent quietly doing the work nobody wants to do twice.',
  'Not sure which of these your project needs? Describe it and I will tell you.',
  'Start a project',
  '#contact'
where not exists (select 1 from public.services_section);

/* --- Seed: the offers ----------------------------------------------------- */
-- Everything below is editable at /admin/services — nothing here is hardcoded
-- in the app, and the public section mirrors these same four as its fallback
-- until this migration runs (features/services/data.ts).

insert into public.services (title, summary, icon_name, deliverables, display_order)
select
  'Full-Stack Web Development',
  'Product-grade web applications built end to end — a considered interface on the front, a schema and API that hold up behind it.',
  'code',
  array[
    'Next.js + TypeScript front end, built against a real design system',
    'Postgres schema, auth and row-level security',
    'Typed API routes and server actions',
    'Deployed, monitored and handed over with the keys'
  ],
  0
where not exists (
  select 1 from public.services where lower(title) = 'full-stack web development'
);

insert into public.services (title, summary, icon_name, deliverables, display_order)
select
  'AI Agents & Chatbots',
  'Agents that do the job rather than demo it — grounded in your own data, wired to your own tools, and honest about what they do not know.',
  'bot',
  array[
    'RAG pipelines over your documents and databases',
    'Tool-calling agents with MCP integrations',
    'Conversational interfaces with streaming responses',
    'Evaluation and guardrails before anything ships'
  ],
  1
where not exists (
  select 1 from public.services where lower(title) = 'ai agents & chatbots'
);

insert into public.services (title, summary, icon_name, deliverables, display_order)
select
  'Workflow Automation',
  'The repetitive half of a business, handed to software — the work still happens, nobody has to do it by hand twice.',
  'workflow',
  array[
    'Multi-step automations across the tools you already pay for',
    'Scheduled jobs, webhooks and event-driven triggers',
    'Document, email and data-entry pipelines',
    'Dashboards so you can see it running'
  ],
  2
where not exists (
  select 1 from public.services where lower(title) = 'workflow automation'
);

insert into public.services (title, summary, icon_name, deliverables, display_order)
select
  'Backend & API Engineering',
  'The part nobody sees until it breaks: data models, integrations and services designed to stay boring under load.',
  'server',
  array[
    'REST and streaming APIs with typed contracts',
    'Database design, migrations and query tuning',
    'Third-party and payment integrations',
    'Background jobs, queues and caching'
  ],
  3
where not exists (
  select 1 from public.services where lower(title) = 'backend & api engineering'
);

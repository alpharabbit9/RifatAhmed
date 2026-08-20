-- ---------------------------------------------------------------------------
-- Phase 4 — Case-study copy for /projects/<slug>
--
-- The card only needs a title, a blurb and three features. The case-study page
-- needs the long form: the ABOUT paragraphs, the PROJECT HIGHLIGHTS numbers and
-- the closing CHALLENGE / SOLUTION / IMPACT triptych. All five live on
-- `projects` rather than in a child table — they are only ever edited inside
-- the project form and never queried on their own.
--
-- `about` is text[] (one entry per paragraph) and `highlights` is JSONB
-- ([{ "icon": "users", "value": "3K+", "label": "Users" }, …]) where `icon` is
-- a key from features/projects/icons.ts, allow-listed in the server action.
--
-- Every field is optional: a project with no highlights simply doesn't render
-- that row. Reads use `select("*")` precisely so a database still on 0004
-- keeps working — the page just shows the short form until this is applied.
--
-- Run order: after 0004_projects.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists about      text[] not null default '{}',
  add column if not exists highlights jsonb  not null default '[]'::jsonb,
  add column if not exists challenge  text   not null default '',
  add column if not exists solution   text   not null default '',
  add column if not exists impact     text   not null default '';

do $highlights_check$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_highlights_is_array'
  ) then
    alter table public.projects
      add constraint projects_highlights_is_array
      check (jsonb_typeof(highlights) = 'array');
  end if;
end
$highlights_check$;

/* --- Seed: CareerLogic AI's case study ------------------------------------ */
-- Mirrors SAMPLE_CASE_STUDIES in features/projects/projects.ts, so the page
-- reads the same before and after the first admin edit. Only fills a row that
-- hasn't been written yet — an admin's own copy is never overwritten.

update public.projects set
  about = array[
    'CareerLogic AI helps job seekers create ATS-friendly resumes that are optimized for specific roles. The platform leverages AI to analyze resumes, provide smart suggestions, match keywords, and tailor content that gets you noticed.',
    'Built with a modern tech stack and a focus on performance, privacy and user experience — every resume is processed in seconds and never leaves your account.'
  ],
  highlights = '[
     {"icon": "users",  "value": "3K+",  "label": "Users"},
     {"icon": "chart",  "value": "95%",  "label": "Satisfaction"},
     {"icon": "zap",    "value": "2.3s", "label": "Avg. Load Time"}
   ]'::jsonb,
  challenge = 'Many job seekers struggle to create resumes that pass ATS scanners and highlight the right skills. We needed an intelligent system that understands job requirements and delivers customized, high-impact resumes.',
  solution  = 'We combined AI-powered insights with a clean, intuitive interface to help users optimize their resumes effectively. Real-time scoring, keyword matching and smart suggestions make the process fast and effortless.',
  impact    = 'Users get higher resume scores, better interview calls and more confidence in their applications. The platform simplifies the entire resume building process with AI.',
  updated_at = now()
where slug = 'careerlogic-ai'
  and coalesce(array_length(about, 1), 0) = 0
  and challenge = ''
  and solution = ''
  and impact = '';

/* --- Seed: the three demo placeholders ------------------------------------ */
-- Same copy as SAMPLE_CASE_STUDIES, so the rows inserted by
-- 0004_projects_demo_seed.sql get a complete case-study page too. Replace them
-- along with the placeholders themselves as real projects ship. Guarded the
-- same way: an admin's own copy is never overwritten.

update public.projects as p set
  about      = v.about,
  highlights = v.highlights,
  challenge  = v.challenge,
  solution   = v.solution,
  impact     = v.impact,
  updated_at = now()
from (
  values
    (
      'insight-desk',
      array[
        'Insight Desk sits in front of a support inbox: it classifies the incoming ticket, retrieves the passages that answer it, and writes a draft reply the agent can send, edit or reject.',
        'Nothing goes out unreviewed. Every draft cites the document it leaned on, so the agent approving it can check the claim in one click.'
      ],
      '[{"icon": "message", "value": "1.2K", "label": "Tickets / mo"},
        {"icon": "zap",     "value": "40%",  "label": "Deflected"}]'::jsonb,
      'Support volume grew faster than the team could hire, and the same handful of questions kept arriving in slightly different words.',
      'A retrieval-backed agent drafts the answer from the team''s own documentation and hands it to a human, rather than replacing one.',
      'Roughly two in five tickets now close on a first-pass draft, and every reply points back at the doc it came from.'
    ),
    (
      'flowline',
      array[
        'Flowline turns the recurring jobs between a team''s tools into flows anyone can read: a trigger, a few steps, a branch or two, and a log of every run.',
        'The interesting part is the failure path — a step that throws is retried with backoff, and the run stays replayable from the point it broke.'
      ],
      '[{"icon": "workflow", "value": "60+",   "label": "Flows Shipped"},
        {"icon": "shield",   "value": "99.4%", "label": "Run Success"}]'::jsonb,
      'The jobs between tools were spread across cron files and one-off scripts, and a failure was only noticed when someone downstream complained.',
      'One studio where a flow is built visually, every run is logged, and a failed step retries itself before it ever needs a person.',
      'The manual handoffs disappeared, and a broken run now names the step and the reason instead of going quiet.'
    ),
    (
      'doc-atlas',
      array[
        'Doc Atlas indexes a folder of long, dry documents — contracts, specifications, policies — and answers questions across all of them at once.',
        'Answers are assembled from re-ranked passages, and every claim carries the page it came from, so the reader verifies rather than trusts.'
      ],
      '[]'::jsonb,
      'The answer to a question was usually somewhere in a 200-page PDF, and keyword search only found the pages that happened to use the same words.',
      'Chunked embeddings with a re-ranking pass, so the retrieved passages are the ones that answer the question rather than the ones that echo it.',
      'Questions that took an afternoon of reading now resolve in a query, with the source page one click away.'
    )
) as v (slug, about, highlights, challenge, solution, impact)
where p.slug = v.slug
  and coalesce(array_length(p.about, 1), 0) = 0
  and p.challenge = ''
  and p.solution = ''
  and p.impact = '';

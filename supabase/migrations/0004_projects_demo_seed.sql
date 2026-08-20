-- ---------------------------------------------------------------------------
-- Phase 4 — demo projects (placeholder content)
--
-- Three extra published projects so the Projects section has a *stack* to
-- shuffle rather than a single card, and so the card is exercised against the
-- shapes one real project never covers: a second and third category, a
-- four-feature grid, and projects with no live demo.
--
-- These are NOT real work. They mirror the placeholders in
-- features/projects/projects.ts, so the section looks the same whether it is
-- reading the database or falling back. Delete them from /admin/projects (or
-- with the statement at the bottom of this file) as real projects ship.
--
-- Runs after 0004_projects.sql. Safe to re-run: each insert is keyed on its
-- slug and does nothing if the row is already there.
-- ---------------------------------------------------------------------------

insert into public.projects (
  slug, title, subtitle, description, category, technologies, features,
  year, role, live_demo_url, source_code_url, status, featured, display_order
)
values
  (
    'insight-desk',
    'Insight Desk',
    'AI Support Agent',
    'A support agent that reads the ticket, pulls the matching docs and drafts a reply for a human to approve — with every answer traced back to the page it came from.',
    'AI Agent',
    array['Next.js', 'TypeScript', 'LangChain', 'Supabase', 'Tailwind CSS'],
    '[
       {"icon": "bot",     "title": "Auto Triage",      "description": "Sorts and routes on arrival"},
       {"icon": "message", "title": "Draft Replies",    "description": "Human approves before send"},
       {"icon": "chart",   "title": "Deflection Stats", "description": "Tracks what the agent saved"}
     ]'::jsonb,
    '2025',
    'Full Stack Developer',
    null,
    null,
    'published',
    true,
    1
  ),
  (
    'flowline',
    'Flowline',
    'Workflow Automation Studio',
    'A visual builder for the small, dull jobs between tools — triggers, branches and retries, with a run log that says exactly which step failed and why.',
    'Automation',
    array['n8n', 'Node.js', 'Express', 'PostgreSQL', 'React'],
    -- Four on purpose: the card shows the first MAX_CARD_FEATURES (3) and
    -- the case-study page carries the rest, so this row exercises the cap.
    '[
       {"icon": "workflow", "title": "Visual Builder",   "description": "Drag steps into a flow"},
       {"icon": "zap",      "title": "Instant Triggers", "description": "Webhooks, cron or manual"},
       {"icon": "shield",   "title": "Retry & Audit",    "description": "Every run kept and replayable"},
       {"icon": "network",  "title": "Tool Connectors",  "description": "Sheets, Slack, Stripe, HTTP"}
     ]'::jsonb,
    '2025',
    'Backend & Automation',
    null,
    null,
    'published',
    true,
    2
  ),
  (
    'doc-atlas',
    'Doc Atlas',
    'RAG Document Intelligence',
    'Ask a question across a folder of contracts and specifications and get one answer with citations — chunked, embedded and re-ranked so the source is always a click away.',
    'AI + RAG',
    array['Next.js', 'LangChain', 'MCP', 'Prisma', 'PostgreSQL'],
    '[
       {"icon": "search",   "title": "Semantic Search", "description": "Meaning, not keywords"},
       {"icon": "database", "title": "Vector Store",    "description": "pgvector with hybrid re-rank"},
       {"icon": "file",     "title": "Cited Answers",   "description": "Every claim links to a page"}
     ]'::jsonb,
    '2024',
    'AI Engineer',
    null,
    null,
    'published',
    true,
    3
  )
on conflict (slug) do nothing;

-- Undo:
--   delete from public.projects
--   where slug in ('insight-desk', 'flowline', 'doc-atlas');

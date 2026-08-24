-- ---------------------------------------------------------------------------
-- Phase 7 — demo certificates (placeholder content)
--
-- Six certificates so the wall has a *composition* to light rather than one
-- lonely frame, and so the gallery is exercised against the shapes a single
-- row never covers: a second row on desktop, five different categories, and a
-- certificate with no credential link.
--
-- These are NOT verified credentials. They mirror the placeholders in
-- features/achievements/data.ts, so the wall looks the same whether it is
-- reading the database or falling back, and every one of them is left with no
-- image on purpose — that is the state the typeset-plate fallback exists for,
-- and it is what you want to see before uploading your own scans.
--
-- Replace them from /admin/achievements as the real certificates go up (or
-- clear them with the statement at the bottom of this file).
--
-- Runs after 0011_achievements.sql. Safe to re-run: each insert is keyed on
-- its title and does nothing if the row is already there.
-- ---------------------------------------------------------------------------

insert into public.achievements (title, issuer, category, issued_on, credential_url, display_order)
select v.title, v.issuer, v.category, v.issued_on, v.credential_url, v.display_order
from (
  values
    ('Google Cloud Foundations',              'Google Cloud',      'Cloud',       date '2024-05-01', '', 0),
    ('Introduction to Frontend Development',  'Meta',              'Frontend',    date '2024-02-01', '', 1),
    ('AWS Certified Cloud Practitioner',      'Amazon Web Services','Cloud',      date '2024-01-01', '', 2),
    ('JavaScript Algorithms and Data Structures', 'freeCodeCamp',  'Engineering', date '2023-12-01', '', 3),
    ('The Complete Node.js Developer',        'Udemy',             'Backend',     date '2023-11-01', '', 4),
    ('ChatGPT Prompt Engineering',            'DeepLearning.AI',   'AI',          date '2023-07-01', '', 5)
) as v(title, issuer, category, issued_on, credential_url, display_order)
where not exists (
  select 1 from public.achievements a where lower(a.title) = lower(v.title)
);

-- Clear the placeholders once your own certificates are up:
--
--   delete from public.achievements
--   where title in (
--     'Google Cloud Foundations',
--     'Introduction to Frontend Development',
--     'AWS Certified Cloud Practitioner',
--     'JavaScript Algorithms and Data Structures',
--     'The Complete Node.js Developer',
--     'ChatGPT Prompt Engineering'
--   );

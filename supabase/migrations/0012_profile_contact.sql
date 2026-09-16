-- ---------------------------------------------------------------------------
-- Contact details — editable email, phone, address and availability.
--
-- These four strings were hardcoded in two components that disagreed with each
-- other: features/contact/contact-section.tsx shipped
-- `rifatahm033@gmail.com` while features/footer/footer-section.tsx shipped
-- `hello@rifatahmed.dev`, so the same page offered two different addresses.
-- They now live on the `profile` singleton — the row that already owns the
-- name, the tagline and the CV — and are edited at /admin/contact.
--
-- Requires 0010_profile.sql (it creates `profile`). If that has not been
-- applied yet, run it first or this file errors with "relation public.profile
-- does not exist".
--
-- Safe to re-run: every statement is guarded.
-- ---------------------------------------------------------------------------

/* --- Columns -------------------------------------------------------------- */
-- Defaults are the values the two components hardcoded, so applying this
-- changes nothing on screen — it only makes the strings editable. The email
-- default is the real address from the contact section, not the footer's
-- placeholder.

alter table public.profile add column if not exists contact_email      text not null default 'rifatahm033@gmail.com';
-- Blank by default: the phone row is new, and an empty string hides it rather
-- than rendering a contact line that goes nowhere.
alter table public.profile add column if not exists contact_phone      text not null default '';
alter table public.profile add column if not exists contact_location   text not null default 'Dhaka, Bangladesh — working worldwide';
-- The pill under the contact details. Blank hides it.
alter table public.profile add column if not exists availability_label text not null default 'Available for freelance & full-time';

/* --- Backfill ------------------------------------------------------------- */
-- `add column ... default` already backfills existing rows, but a profile row
-- written by an earlier hand-run could hold an empty email. Only that case is
-- touched; a real address the admin has already typed is left alone.

update public.profile
   set contact_email = 'rifatahm033@gmail.com'
 where coalesce(trim(contact_email), '') = '';

update public.profile
   set contact_location = 'Dhaka, Bangladesh — working worldwide'
 where contact_location is null;

/**
 * Phase 1 — Hero / Profile read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Reads degrade the way About, Projects, Career and Services do — until
 * `supabase/migrations/0010_profile.sql` has been applied by hand the public
 * hero renders the defaults below, which are word-for-word the copy the hero
 * shipped with. Applying the migration therefore changes nothing on screen;
 * it only makes the words editable.
 */

import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_ARTWORK,
  FALLBACK_LOGO,
  FALLBACK_PORTRAIT,
} from "@/features/hero/constants";

export type HeroProfile = {
  id: string | null;
  /** One display line per newline — see `nameLines()`. */
  name: string;
  /** Eyebrow labels; more than one cycles through a single slot. */
  role_labels: string[];
  tagline: string;
  bio: string;
  quote_words: string[];
  connect_label: string;
  cta_label: string;
  cta_href: string;
  contact_cta_label: string;
  contact_cta_href: string;
  resume_cta_label: string;
  /** Already resolved to a usable src — the repo asset when nothing is set. */
  portrait_image_url: string;
  portrait_storage_path: string | null;
  artwork_image_url: string;
  artwork_storage_path: string | null;
  logo_url: string;
  logo_storage_path: string | null;
};

const PROFILE_COLUMNS =
  "id, name, role_labels, tagline, bio, quote_words, connect_label, " +
  "cta_label, cta_href, contact_cta_label, contact_cta_href, resume_cta_label, " +
  "portrait_image_url, portrait_storage_path, artwork_image_url, " +
  "artwork_storage_path, logo_url, logo_storage_path";

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the seed block of migration 0010                         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PROFILE: HeroProfile = {
  id: null,
  name: "Rifat\nAhmed",
  role_labels: ["Full Stack Developer", "AI Agent Builder"],
  tagline: "Building products & AI agents that make an impact.",
  bio: "Full Stack Developer & AI Agent Builder passionate about creating modern web apps, smart automations and meaningful digital experiences.",
  quote_words: ["Code.", "Create.", "Automate.", "Repeat."],
  connect_label: "Let's Connect",
  cta_label: "View My Work",
  cta_href: "#projects",
  contact_cta_label: "Let's Talk",
  contact_cta_href: "#contact",
  resume_cta_label: "Download CV",
  portrait_image_url: FALLBACK_PORTRAIT,
  portrait_storage_path: null,
  artwork_image_url: FALLBACK_ARTWORK,
  artwork_storage_path: null,
  logo_url: FALLBACK_LOGO,
  logo_storage_path: null,
};

/**
 * Shown only while `social_links` is empty — the table has no seed, and a
 * hero with no social cluster reads as a broken layout rather than a choice.
 * Anything the admin adds in /admin/footer replaces the whole set.
 */
export const DEFAULT_SOCIALS = [
  { id: "default-github", platform: "GitHub", url: "https://github.com" },
  { id: "default-linkedin", platform: "LinkedIn", url: "https://linkedin.com" },
  { id: "default-email", platform: "Email", url: "mailto:hello@rifatahmed.dev" },
];

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

function cleanList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value.flatMap((entry) =>
    typeof entry === "string" && entry.trim() ? [entry.trim()] : [],
  );

  return cleaned;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optional(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normaliseProfile(row: Record<string, unknown>): HeroProfile {
  return {
    id: typeof row.id === "string" ? row.id : null,
    // Individually blank columns fall back — an empty name would otherwise
    // render as a hole where the largest thing on the page should be.
    name: text(row.name, DEFAULT_PROFILE.name),
    role_labels: cleanList(row.role_labels, DEFAULT_PROFILE.role_labels),
    tagline: text(row.tagline, DEFAULT_PROFILE.tagline),
    bio: text(row.bio, DEFAULT_PROFILE.bio),
    // These three are allowed to be empty: blank means "hide it", which is a
    // real editorial choice rather than missing data.
    quote_words: cleanList(row.quote_words, []),
    connect_label: typeof row.connect_label === "string" ? row.connect_label.trim() : "",
    cta_label: typeof row.cta_label === "string" ? row.cta_label.trim() : "",
    cta_href: text(row.cta_href, DEFAULT_PROFILE.cta_href),
    contact_cta_label:
      typeof row.contact_cta_label === "string"
        ? row.contact_cta_label.trim()
        : "",
    contact_cta_href: text(
      row.contact_cta_href,
      DEFAULT_PROFILE.contact_cta_href,
    ),
    resume_cta_label:
      typeof row.resume_cta_label === "string"
        ? row.resume_cta_label.trim()
        : "",
    portrait_image_url: text(row.portrait_image_url, FALLBACK_PORTRAIT),
    portrait_storage_path: optional(row.portrait_storage_path),
    artwork_image_url: text(row.artwork_image_url, FALLBACK_ARTWORK),
    artwork_storage_path: optional(row.artwork_storage_path),
    logo_url: text(row.logo_url, FALLBACK_LOGO),
    logo_storage_path: optional(row.logo_storage_path),
  };
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export async function getProfile(): Promise<HeroProfile> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile")
    .select(PROFILE_COLUMNS)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[hero] profile read failed:", error.message);
    }
    return DEFAULT_PROFILE;
  }

  return normaliseProfile(data as unknown as Record<string, unknown>);
}

/**
 * Just the navbar mark. Its own query so the header doesn't have to thread the
 * whole profile through `app/page.tsx`, and so a missing `profile` table costs
 * the header nothing.
 */
export async function getLogoUrl(): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profile")
    .select("logo_url")
    .limit(1)
    .maybeSingle();

  return text(data?.logo_url, FALLBACK_LOGO);
}

/* -------------------------------------------------------------------------- */
/* Admin read                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The admin screen must NOT fall back: editing seeded placeholder content that
 * doesn't exist in the database would silently do nothing. A failure here is
 * surfaced as "apply the migration" instead.
 */
export async function getAdminProfile(): Promise<
  { ok: true; profile: HeroProfile } | { ok: false; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile")
    .select(PROFILE_COLUMNS)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    // No row yet (migration applied without the seed) — pre-fill the form with
    // the same defaults the public hero falls back to, so saving adopts them.
    profile: data
      ? normaliseProfile(data as unknown as Record<string, unknown>)
      : DEFAULT_PROFILE,
  };
}

/**
 * Phase 7 — Achievements read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Reads degrade the way About, Projects, Career and Services do — until
 * `supabase/migrations/0011_achievements.sql` has been applied by hand, the
 * public wall renders the placeholders below instead of a hole. A table that
 * exists but is empty is respected as-is: no rows means the admin cleared it
 * on purpose, and the section hides itself.
 */

import { createClient } from "@/lib/supabase/server";

export type AchievementsSection = {
  id: string | null;
  eyebrow: string;
  heading: string;
  /** The words inside `heading` set in burgundy. Blank = no highlight. */
  heading_accent: string;
  standfirst: string;
};

export type Achievement = {
  id: string;
  title: string;
  issuer: string;
  category: string;
  /** `YYYY-MM-DD` (always the 1st) or null. Formatted by `formatIssued`. */
  issued_on: string | null;
  /** Blank hides the "View credential" button in the viewer. */
  credential_url: string;
  /** Null renders the typeset plate inside the frame instead of a scan. */
  image_url: string | null;
  image_storage_path: string | null;
  display_order: number;
};

const ACHIEVEMENT_COLUMNS =
  "id, title, issuer, category, issued_on, credential_url, image_url, image_storage_path, display_order";

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the seed blocks of migration 0011                        */
/* -------------------------------------------------------------------------- */

export const DEFAULT_ACHIEVEMENTS_SECTION: AchievementsSection = {
  id: null,
  eyebrow: "My Achievements",
  heading: "Certificates that reflect growth.",
  heading_accent: "that reflect",
  standfirst:
    "A collection of certifications and achievements that represent continuous learning, dedication, and skill development.",
};

/**
 * Placeholders, mirroring `0011_achievements_demo_seed.sql`. Every one has a
 * null image on purpose — that is the state the typeset plate exists for, and
 * it means the wall never ships a broken image for a scan nobody uploaded.
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "default-google-cloud",
    title: "Google Cloud Foundations",
    issuer: "Google Cloud",
    category: "Cloud",
    issued_on: "2024-05-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 0,
  },
  {
    id: "default-meta-frontend",
    title: "Introduction to Frontend Development",
    issuer: "Meta",
    category: "Frontend",
    issued_on: "2024-02-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 1,
  },
  {
    id: "default-aws-practitioner",
    title: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    category: "Cloud",
    issued_on: "2024-01-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 2,
  },
  {
    id: "default-fcc-algorithms",
    title: "JavaScript Algorithms and Data Structures",
    issuer: "freeCodeCamp",
    category: "Engineering",
    issued_on: "2023-12-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 3,
  },
  {
    id: "default-node-developer",
    title: "The Complete Node.js Developer",
    issuer: "Udemy",
    category: "Backend",
    issued_on: "2023-11-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 4,
  },
  {
    id: "default-prompt-engineering",
    title: "ChatGPT Prompt Engineering",
    issuer: "DeepLearning.AI",
    category: "AI",
    issued_on: "2023-07-01",
    credential_url: "",
    image_url: null,
    image_storage_path: null,
    display_order: 5,
  },
];

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Blank strings from the database become null, so "no scan" has one shape. */
function nullableText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normaliseAchievement(row: Record<string, unknown>): Achievement {
  return {
    id: String(row.id),
    title: text(row.title),
    issuer: text(row.issuer),
    category: text(row.category),
    issued_on: nullableText(row.issued_on),
    credential_url: text(row.credential_url),
    image_url: nullableText(row.image_url),
    image_storage_path: nullableText(row.image_storage_path),
    display_order:
      typeof row.display_order === "number" ? row.display_order : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export async function getAchievementsSection(): Promise<AchievementsSection> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("achievements_section")
    .select("id, eyebrow, heading, heading_accent, standfirst")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[achievements] section read failed:", error.message);
    }
    return DEFAULT_ACHIEVEMENTS_SECTION;
  }

  // Individually blank columns fall back too — an empty heading would
  // otherwise render as a hole in the layout. `standfirst` and
  // `heading_accent` are the exceptions: blank there means "hide it" and
  // "highlight nothing", which are both real choices.
  return {
    id: data.id,
    eyebrow: data.eyebrow?.trim() || DEFAULT_ACHIEVEMENTS_SECTION.eyebrow,
    heading: data.heading?.trim() || DEFAULT_ACHIEVEMENTS_SECTION.heading,
    heading_accent: data.heading_accent ?? "",
    standfirst: data.standfirst ?? "",
  };
}

export async function getAchievements(): Promise<Achievement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("achievements")
    .select(ACHIEVEMENT_COLUMNS)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[achievements] read failed:", error.message);
    return DEFAULT_ACHIEVEMENTS;
  }

  return (data ?? []).map((row) =>
    normaliseAchievement(row as Record<string, unknown>),
  );
}

/* -------------------------------------------------------------------------- */
/* Admin read                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The admin screen must NOT fall back: editing seeded placeholder content that
 * does not exist in the database would silently do nothing. A failure here is
 * surfaced as "apply the migration" instead.
 */
export async function getAdminAchievements(): Promise<
  | { ok: true; section: AchievementsSection; achievements: Achievement[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const [sectionResult, achievementsResult] = await Promise.all([
    supabase
      .from("achievements_section")
      .select("id, eyebrow, heading, heading_accent, standfirst")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("achievements")
      .select(ACHIEVEMENT_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const failure = sectionResult.error ?? achievementsResult.error;
  if (failure) {
    return { ok: false, error: failure.message };
  }

  return {
    ok: true,
    // No row yet (migration applied without the seed) — pre-fill the form with
    // the same defaults the public site falls back to, so saving adopts them.
    section: sectionResult.data
      ? (sectionResult.data as AchievementsSection)
      : DEFAULT_ACHIEVEMENTS_SECTION,
    achievements: (achievementsResult.data ?? []).map((row) =>
      normaliseAchievement(row as Record<string, unknown>),
    ),
  };
}

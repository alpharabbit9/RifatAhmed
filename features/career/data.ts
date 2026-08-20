/**
 * Phase 5 — Career Journey read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Reads degrade the way About and Projects do — until
 * `supabase/migrations/0006_career_journey.sql` has been applied by hand, the
 * public timeline renders the defaults below instead of a hole. A table that
 * exists but is empty is respected as-is: no rows means the admin deleted
 * them on purpose.
 */

import { createClient } from "@/lib/supabase/server";

export type CareerSection = {
  id: string | null;
  eyebrow: string;
  heading: string;
  standfirst: string;
};

export type CareerEntry = {
  id: string;
  role: string;
  company: string;
  company_url: string | null;
  employment_type: string;
  location: string;
  /** `YYYY-MM-01`, month precision. Null = not filled in yet. */
  start_date: string | null;
  /** Null = current role ("Present"). */
  end_date: string | null;
  description: string;
  highlights: string[];
  skills: string[];
  logo_url: string | null;
  logo_storage_path: string | null;
  display_order: number;
};

const ENTRY_COLUMNS =
  "id, role, company, company_url, employment_type, location, start_date, end_date, description, highlights, skills, logo_url, logo_storage_path, display_order";

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the seed block of migration 0006                         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CAREER_SECTION: CareerSection = {
  id: null,
  eyebrow: "Career Journey",
  heading: "Where I have worked",
  standfirst:
    "The roles behind the work — what each company does, what I owned there, and what I took with me.",
};

export const DEFAULT_CAREER_ENTRIES: CareerEntry[] = [
  {
    id: "default-samstop",
    role: "Administrator & Social Media Manager",
    company: "Samstop UK LTD",
    company_url: null,
    employment_type: "Full-time",
    location: "United Kingdom · Remote",
    start_date: "2023-01-01",
    end_date: "2024-12-01",
    description:
      "Samstop UK LTD is a consultancy and UK sponsorship company that guides international candidates and employers through the visa sponsorship process. I ran the day-to-day administration alongside the company's social media presence.",
    highlights: [
      "Handled day-to-day administration — client records, document checks and correspondence across live sponsorship applications.",
      "Owned the social media presence end to end: content calendar, copywriting, scheduling and community replies.",
      "Kept applicant case files organised and current, so any consultant could pick up a case without a handover.",
      "Triaged inbound enquiries from email and social channels and routed qualified leads to the consultancy team.",
    ],
    skills: [
      "Administration",
      "Social Media Management",
      "Content Strategy",
      "Client Communication",
      "Document Management",
      "Reporting",
    ],
    logo_url: "/logos/samstop-uk.svg",
    logo_storage_path: null,
    display_order: 0,
  },
];

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) =>
    typeof entry === "string" && entry.trim() ? [entry.trim()] : [],
  );
}

function normaliseEntry(row: Record<string, unknown>): CareerEntry {
  return {
    id: String(row.id),
    role: typeof row.role === "string" ? row.role : "",
    company: typeof row.company === "string" ? row.company : "",
    company_url:
      typeof row.company_url === "string" && row.company_url
        ? row.company_url
        : null,
    employment_type:
      typeof row.employment_type === "string" ? row.employment_type : "",
    location: typeof row.location === "string" ? row.location : "",
    start_date: typeof row.start_date === "string" ? row.start_date : null,
    end_date: typeof row.end_date === "string" ? row.end_date : null,
    description: typeof row.description === "string" ? row.description : "",
    highlights: cleanList(row.highlights),
    skills: cleanList(row.skills),
    logo_url:
      typeof row.logo_url === "string" && row.logo_url ? row.logo_url : null,
    logo_storage_path:
      typeof row.logo_storage_path === "string" && row.logo_storage_path
        ? row.logo_storage_path
        : null,
    display_order:
      typeof row.display_order === "number" ? row.display_order : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Public reads                                                               */
/* -------------------------------------------------------------------------- */

export async function getCareerSection(): Promise<CareerSection> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_section")
    .select("id, eyebrow, heading, standfirst")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[career] section read failed:", error.message);
    }
    return DEFAULT_CAREER_SECTION;
  }

  // Individually blank columns fall back too — an empty heading would
  // otherwise render as a hole in the layout.
  return {
    id: data.id,
    eyebrow: data.eyebrow?.trim() || DEFAULT_CAREER_SECTION.eyebrow,
    heading: data.heading?.trim() || DEFAULT_CAREER_SECTION.heading,
    standfirst: data.standfirst ?? "",
  };
}

export async function getCareerEntries(): Promise<CareerEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("career_journey")
    .select(ENTRY_COLUMNS)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[career] entries read failed:", error.message);
    return DEFAULT_CAREER_ENTRIES;
  }

  return (data ?? []).map((row) =>
    normaliseEntry(row as Record<string, unknown>),
  );
}

/* -------------------------------------------------------------------------- */
/* Admin read                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The admin screen must NOT fall back: editing seeded placeholder content that
 * doesn't exist in the database would silently do nothing. A failure here is
 * surfaced as "apply the migration" instead.
 */
export async function getAdminCareer(): Promise<
  | { ok: true; section: CareerSection; entries: CareerEntry[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient();

  const [sectionResult, entriesResult] = await Promise.all([
    supabase
      .from("career_section")
      .select("id, eyebrow, heading, standfirst")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("career_journey")
      .select(ENTRY_COLUMNS)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const failure = sectionResult.error ?? entriesResult.error;
  if (failure) {
    return { ok: false, error: failure.message };
  }

  return {
    ok: true,
    // No row yet (migration applied without the seed) — pre-fill the form with
    // the same defaults the public site falls back to, so saving adopts them.
    section: sectionResult.data
      ? (sectionResult.data as CareerSection)
      : DEFAULT_CAREER_SECTION,
    entries: (entriesResult.data ?? []).map((row) =>
      normaliseEntry(row as Record<string, unknown>),
    ),
  };
}

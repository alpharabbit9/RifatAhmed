/**
 * Phase 4 — Projects read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 *
 * Reads degrade the same way the About section does — if
 * `supabase/migrations/0004_projects.sql` hasn't been applied yet, the public
 * section renders `SAMPLE_PROJECTS` instead of a hole. A table that exists but
 * is empty is respected as-is: no rows means the admin deleted them.
 */

import { createClient } from "@/lib/supabase/server";
import { pickShowcaseImage, projectHref } from "@/features/projects/constants";
import {
  getSampleCaseStudy,
  SAMPLE_PROJECTS,
} from "@/features/projects/projects";
import type {
  CaseStudyProject,
  ProjectFeatureInput,
  ProjectHighlightInput,
  ProjectImageRow,
  ProjectRow,
  ShowcaseProject,
} from "@/features/projects/types";

/**
 * `*` rather than an explicit list, deliberately: the case-study columns
 * arrive with `0005_project_case_study.sql`, and migrations here are applied
 * by hand. Naming them would make every read 400 on a database that only has
 * 0004; `*` returns whatever exists and `normaliseRow` fills in the rest.
 *
 * The `!project_images_project_id_fkey` hint is *required*, not decoration:
 * there are two foreign keys between these tables (`project_images.project_id`
 * and `projects.showcase_image_id`), so an unqualified embed is ambiguous and
 * PostgREST rejects the whole query with PGRST201 — which used to send every
 * read down the sample-data fallback path.
 */
const PROJECT_COLUMNS =
  "*, images:project_images!project_images_project_id_fkey(id, project_id, url, storage_path, alt, display_order)";

function sortImages(images: ProjectImageRow[]): ProjectImageRow[] {
  return [...images].sort((a, b) => a.display_order - b.display_order);
}

function normaliseFeatures(value: unknown): ProjectFeatureInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { icon, title, description } = entry as Record<string, unknown>;
    if (typeof title !== "string" || !title.trim()) return [];

    return [
      {
        icon: typeof icon === "string" ? icon : "sparkles",
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
      },
    ];
  });
}

function normaliseHighlights(value: unknown): ProjectHighlightInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { icon, value: figure, label } = entry as Record<string, unknown>;
    if (typeof figure !== "string" || !figure.trim()) return [];

    return [
      {
        icon: typeof icon === "string" ? icon : "sparkles",
        value: figure.trim(),
        label: typeof label === "string" ? label.trim() : "",
      },
    ];
  });
}

/** Drops blank paragraphs — the admin's textarea splits on empty lines. */
function normaliseParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) =>
    typeof entry === "string" && entry.trim() ? [entry.trim()] : [],
  );
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Whatever Supabase returned → a complete `ProjectRow`.
 *
 * Every field the case study needs is optional in the database until 0005 is
 * applied, so each one is defaulted here rather than at a dozen call sites.
 */
function normaliseRow(raw: unknown): ProjectRow {
  const row = raw as ProjectRow;

  return {
    ...row,
    features: normaliseFeatures(row.features),
    images: sortImages(row.images ?? []),
    technologies: row.technologies ?? [],
    about: normaliseParagraphs(row.about),
    highlights: normaliseHighlights(row.highlights),
    challenge: textOf(row.challenge),
    solution: textOf(row.solution),
    impact: textOf(row.impact),
  };
}

/** Database row → the shape `<ProjectShowcaseCard>` renders. */
export function toShowcaseProject(row: ProjectRow): ShowcaseProject {
  const showcase = pickShowcaseImage(row);

  return {
    title: row.title,
    subtitle: row.subtitle ?? "",
    category: row.category,
    description: row.description ?? "",
    screenshot: showcase?.url ?? null,
    screenshotAlt: showcase?.alt ?? undefined,
    // The icon stays a string here: this runs in a Server Component, and the
    // card resolves the key to a component on the client.
    features: normaliseFeatures(row.features),
    technologies: row.technologies ?? [],
    year: row.year ?? "",
    role: row.role ?? "",
    projectUrl: projectHref(row.slug),
    liveDemo: row.live_demo_url?.trim() ? row.live_demo_url : undefined,
  };
}

/** Database row → the shape `/projects/<slug>` renders. */
export function toCaseStudyProject(row: ProjectRow): CaseStudyProject {
  const images = sortImages(row.images ?? []);
  const showcase = pickShowcaseImage(row);

  // Showcase image first — it is what the hero frame opens on, and what the
  // card on the home page already showed the visitor on the way in.
  const ordered = showcase
    ? [showcase, ...images.filter((image) => image.id !== showcase.id)]
    : images;

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    category: row.category,
    description: row.description ?? "",
    year: row.year ?? "",
    role: row.role ?? "",
    liveDemo: row.live_demo_url?.trim() ? row.live_demo_url : undefined,
    sourceCode: row.source_code_url?.trim() ? row.source_code_url : undefined,
    gallery: ordered.map((image) => ({ url: image.url, alt: image.alt })),
    about: row.about,
    // Icons stay string keys across the RSC boundary — see ./icons.ts.
    features: row.features,
    techStack: row.technologies ?? [],
    highlights: row.highlights,
    challenge: row.challenge,
    solution: row.solution,
    impact: row.impact,
  };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Published projects for the public section, newest-first inside the admin's
 * manual order. `featuredOnly` narrows it to the home-page set.
 */
export async function getShowcaseProjects(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<ShowcaseProject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    // Missing table (migration not applied yet) — fall back to the sample so
    // the section still renders. A real query failure logs the same way.
    console.error("[projects] read failed:", error.message);
    return SAMPLE_PROJECTS;
  }

  return (data ?? []).map((row) => toShowcaseProject(normaliseRow(row)));
}

/**
 * One case study by slug, or `null` for a slug that has no project (the route
 * turns that into a 404).
 *
 * Status is *not* filtered here on purpose: RLS already hides drafts from
 * anonymous visitors, so a logged-in admin can preview an unpublished case
 * study at its real URL while everyone else gets the 404.
 */
export async function getCaseStudyProject(
  slug: string,
): Promise<CaseStudyProject | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // Missing table (migration not applied yet) — serve the sample case study
    // so the card's "View Project" CTA doesn't dead-end. A real query failure
    // logs the same way.
    console.error("[projects] case study read failed:", error.message);
    return getSampleCaseStudy(slug);
  }

  // The table exists and has no such slug: a 404, not a fallback.
  return data ? toCaseStudyProject(normaliseRow(data)) : null;
}

/** Every project, drafts included — admin only (RLS enforces the session). */
export async function getAdminProjects(): Promise<
  { ok: true; projects: ProjectRow[] } | { ok: false; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, projects: (data ?? []).map(normaliseRow) };
}

export async function getAdminProject(
  id: string,
): Promise<{ ok: true; project: ProjectRow } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "That project no longer exists." };
  }

  return { ok: true, project: normaliseRow(data) };
}

/**
 * Every technology label already used across projects (plus the skill labels
 * from the About section) — powers the admin's tech-stack autocomplete.
 */
export async function getTechnologySuggestions(): Promise<string[]> {
  const supabase = await createClient();

  const [projectsResult, skillsResult] = await Promise.all([
    supabase.from("projects").select("technologies"),
    supabase.from("skills").select("label"),
  ]);

  const labels = new Set<string>();

  for (const row of projectsResult.data ?? []) {
    for (const label of (row.technologies as string[] | null) ?? []) {
      if (label.trim()) labels.add(label.trim());
    }
  }
  for (const row of skillsResult.data ?? []) {
    const label = (row.label as string | null)?.trim();
    if (label) labels.add(label);
  }

  return [...labels].sort((a, b) => a.localeCompare(b));
}


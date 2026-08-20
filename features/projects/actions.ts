"use server";

/**
 * Phase 4 — Projects admin mutations.
 *
 * All admin-only. RLS blocks anonymous writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result (same pattern as `features/about/actions.ts`).
 *
 * Image *files* are uploaded straight from the browser to the `media` bucket
 * (see `features/projects/upload.ts`) — Server Actions cap request bodies at
 * 1 MB by default, which a screenshot blows past instantly. What arrives here
 * is only the resulting metadata, so a save stays small and fast.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isFeatureIconName } from "@/features/projects/icons";
import {
  MAX_ABOUT_PARAGRAPHS,
  MAX_FEATURES,
  MAX_HIGHLIGHTS,
  MAX_IMAGES,
  MAX_TECHNOLOGIES,
  MEDIA_BUCKET,
  slugify,
} from "@/features/projects/constants";
import type {
  ProjectFeatureInput,
  ProjectHighlightInput,
  ProjectImageInput,
  ProjectInput,
  ProjectStatus,
} from "@/features/projects/types";

export type ProjectActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  return supabase;
}

function refreshProjects(slug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/projects");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
  }
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

/** Only http(s) links reach the public card — no `javascript:` smuggling. */
function safeUrl(value: unknown): string | null {
  const raw = text(value, 2048);
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanFeatures(value: unknown): ProjectFeatureInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const { icon, title, description } = entry as Record<string, unknown>;

      const cleanTitle = text(title, 60);
      if (!cleanTitle) return []; // A feature with no title is a blank row.

      const iconName = typeof icon === "string" && isFeatureIconName(icon) ? icon : "sparkles";

      return [{ icon: iconName, title: cleanTitle, description: text(description, 140) }];
    })
    .slice(0, MAX_FEATURES);
}

/** ABOUT THE PROJECT — blank paragraphs never reach the page. */
function cleanParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry) => {
      const paragraph = text(entry, 1200);
      return paragraph ? [paragraph] : [];
    })
    .slice(0, MAX_ABOUT_PARAGRAPHS);
}

/** PROJECT HIGHLIGHTS — a figure with no value is a blank row, so it's cut. */
function cleanHighlights(value: unknown): ProjectHighlightInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const { icon, value: figure, label } = entry as Record<string, unknown>;

      const cleanValue = text(figure, 12);
      if (!cleanValue) return [];

      const iconName =
        typeof icon === "string" && isFeatureIconName(icon) ? icon : "sparkles";

      return [{ icon: iconName, value: cleanValue, label: text(label, 40) }];
    })
    .slice(0, MAX_HIGHLIGHTS);
}

function cleanTechnologies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const labels: string[] = [];

  for (const entry of value) {
    const label = text(entry, 40);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
    if (labels.length === MAX_TECHNOLOGIES) break;
  }

  return labels;
}

function cleanImages(value: unknown): ProjectImageInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const { id, url, storage_path, alt } = entry as Record<string, unknown>;

      const cleanUrl = text(url, 2048);
      if (!cleanUrl) return [];

      return [
        {
          id: typeof id === "string" && id ? id : null,
          url: cleanUrl,
          storage_path: typeof storage_path === "string" && storage_path ? storage_path : null,
          alt: text(alt, 160) || null,
        },
      ];
    })
    .slice(0, MAX_IMAGES);
}

type CleanProject = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  technologies: string[];
  features: ProjectFeatureInput[];
  year: string;
  role: string;
  live_demo_url: string | null;
  source_code_url: string | null;
  status: ProjectStatus;
  featured: boolean;
  about: string[];
  highlights: ProjectHighlightInput[];
  challenge: string;
  solution: string;
  impact: string;
};

function clean(input: ProjectInput): { ok: true; values: CleanProject } | { ok: false; error: string } {
  const title = text(input.title, 120);
  if (!title) {
    return { ok: false, error: "A project title is required." };
  }

  const category = text(input.category, 60);
  if (!category) {
    return { ok: false, error: "Pick or type a category." };
  }

  return {
    ok: true,
    values: {
      slug: slugify(text(input.slug, 80) || title),
      title,
      subtitle: text(input.subtitle, 160),
      description: text(input.description, 800),
      category,
      technologies: cleanTechnologies(input.technologies),
      features: cleanFeatures(input.features),
      year: text(input.year, 20),
      role: text(input.role, 80),
      live_demo_url: safeUrl(input.live_demo_url),
      source_code_url: safeUrl(input.source_code_url),
      status: input.status === "published" ? "published" : "draft",
      featured: Boolean(input.featured),
      about: cleanParagraphs(input.about),
      highlights: cleanHighlights(input.highlights),
      challenge: text(input.challenge, 600),
      solution: text(input.solution, 600),
      impact: text(input.impact, 600),
    },
  };
}

/** Appends `-2`, `-3`… until the slug is free (ignoring the row being saved). */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  base: string,
  ignoreId?: string,
): Promise<string> {
  let query = supabase.from("projects").select("id, slug").like("slug", `${base}%`);
  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data } = await query;
  const taken = new Set((data ?? []).map((row) => row.slug as string));

  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

async function nextOrder(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
): Promise<number> {
  const { data } = await supabase
    .from("projects")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ((data?.display_order as number | undefined) ?? -1) + 1;
}

/**
 * Writes the gallery: inserts what's new, deletes what the admin removed
 * (rows *and* the files behind them), renumbers the rest, then points
 * `showcase_image_id` at the chosen shot.
 */
async function syncImages(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  projectId: string,
  images: ProjectImageInput[],
  showcasePath: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existingRows, error: readError } = await supabase
    .from("project_images")
    .select("id, storage_path")
    .eq("project_id", projectId);

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const keptIds = new Set(images.map((image) => image.id).filter(Boolean) as string[]);
  const removed = (existingRows ?? []).filter((row) => !keptIds.has(row.id as string));

  if (removed.length > 0) {
    const { error } = await supabase
      .from("project_images")
      .delete()
      .in(
        "id",
        removed.map((row) => row.id as string),
      );

    if (error) {
      return { ok: false, error: error.message };
    }

    // Orphaned files would otherwise sit in the bucket forever. A storage
    // failure here isn't worth failing the save over — the row is already gone.
    const paths = removed
      .map((row) => row.storage_path as string | null)
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) {
      await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    }
  }

  for (const [position, image] of images.entries()) {
    if (image.id) {
      const { error } = await supabase
        .from("project_images")
        .update({ display_order: position, alt: image.alt })
        .eq("id", image.id);

      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      const { error } = await supabase.from("project_images").insert({
        project_id: projectId,
        url: image.url,
        storage_path: image.storage_path,
        alt: image.alt,
        display_order: position,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
    }
  }

  // Resolved after the writes so a freshly-inserted image can be the pick.
  // `storage_path` is the join key: it survives the round trip, unlike a row
  // id the browser never had.
  let showcaseId: string | null = null;

  if (showcasePath) {
    const { data: match } = await supabase
      .from("project_images")
      .select("id")
      .eq("project_id", projectId)
      .eq("storage_path", showcasePath)
      .maybeSingle();

    showcaseId = (match?.id as string | undefined) ?? null;

    // Rows imported without a storage path (or picked before one existed)
    // still resolve — the key falls back to the public URL.
    if (!showcaseId) {
      const { data: byUrl } = await supabase
        .from("project_images")
        .select("id")
        .eq("project_id", projectId)
        .eq("url", showcasePath)
        .maybeSingle();

      showcaseId = (byUrl?.id as string | undefined) ?? null;
    }
  }

  if (!showcaseId) {
    // Nothing chosen (or the chosen file was removed) — fall back to the
    // first image so the card is never blank while a gallery exists.
    const { data: first } = await supabase
      .from("project_images")
      .select("id")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    showcaseId = (first?.id as string | undefined) ?? null;
  }

  const { error } = await supabase
    .from("projects")
    .update({ showcase_image_id: showcaseId })
    .eq("id", projectId);

  return error ? { ok: false, error: error.message } : { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Create / update / delete                                                   */
/* -------------------------------------------------------------------------- */

export async function createProject(input: ProjectInput): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const parsed = clean(input);
  if (!parsed.ok) return parsed;

  const values = {
    ...parsed.values,
    slug: await uniqueSlug(supabase, parsed.values.slug),
    display_order: await nextOrder(supabase),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(values)
    .select("id, slug")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  const images = cleanImages(input.images);

  if (images.length > 0) {
    const synced = await syncImages(
      supabase,
      data.id as string,
      images,
      input.showcase_storage_path ?? null,
    );

    if (!synced.ok) {
      // Don't leave a half-built project behind — the admin retries cleanly.
      await supabase.from("projects").delete().eq("id", data.id as string);
      return synced;
    }
  }

  refreshProjects(data.slug as string);
  return { ok: true, id: data.id as string };
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const parsed = clean(input);
  if (!parsed.ok) return parsed;

  const values = {
    ...parsed.values,
    slug: await uniqueSlug(supabase, parsed.values.slug, id),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("projects").update(values).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const synced = await syncImages(
    supabase,
    id,
    cleanImages(input.images),
    input.showcase_storage_path ?? null,
  );

  if (!synced.ok) return synced;

  refreshProjects(values.slug);
  return { ok: true, id };
}

export async function deleteProject(id: string): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  // Collect the files first — the rows cascade away with the project.
  const { data: images } = await supabase
    .from("project_images")
    .select("storage_path")
    .eq("project_id", id);

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const paths = (images ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  }

  refreshProjects();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* List-level toggles + ordering                                              */
/* -------------------------------------------------------------------------- */

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("projects")
    .update({
      status: status === "published" ? "published" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshProjects();
  return { ok: true };
}

export async function setProjectFeatured(
  id: string,
  featured: boolean,
): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("projects")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshProjects();
  return { ok: true };
}

/**
 * Swaps a project with its neighbour, then rewrites the whole list to a dense
 * 0..n-1 order so repeated moves can't wedge on duplicate order values.
 */
export async function moveProject(
  id: string,
  direction: "up" | "down",
): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("projects")
    .select("id, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as { id: string; display_order: number }[];
  if (rows.length < 2) return { ok: true };

  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || target < 0 || target >= rows.length) {
    return { ok: true }; // Already at the edge — a no-op, not an error.
  }

  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  for (const [position, row] of reordered.entries()) {
    const { error: updateError } = await supabase
      .from("projects")
      .update({ display_order: position })
      .eq("id", row.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  }

  refreshProjects();
  return { ok: true };
}

/**
 * Removes files the browser uploaded for a form that was never saved.
 * Best-effort: the admin has already navigated away by the time it runs.
 */
export async function discardUploads(paths: string[]): Promise<ProjectActionResult> {
  const supabase = await requireAdmin();

  const safe = paths
    .filter((path): path is string => typeof path === "string" && path.startsWith("projects/"))
    .slice(0, MAX_IMAGES);

  if (safe.length === 0) return { ok: true };

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(safe);

  return error ? { ok: false, error: error.message } : { ok: true };
}

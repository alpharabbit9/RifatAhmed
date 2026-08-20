/**
 * Shared constants + pure helpers for the Projects feature.
 *
 * Deliberately its own module: `actions.ts` is a `"use server"` file, and
 * everything exported from one of those becomes a callable RPC endpoint (so
 * it may only export async functions). The bucket name, the limits and
 * `slugify` are needed by both the server actions and the browser form, so
 * they live here where both sides can import them.
 */

import type { ProjectImageRow } from "@/features/projects/types";

export const MEDIA_BUCKET = "media";

export const MAX_FEATURES = 6;
export const MAX_TECHNOLOGIES = 16;
export const MAX_IMAGES = 12;
/** Case-study copy — the detail page's three-column band stays readable. */
export const MAX_ABOUT_PARAGRAPHS = 6;
export const MAX_HIGHLIGHTS = 4;
/** Supabase Storage default object limit is 50 MB; screenshots need far less. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
] as const;

/** URL-safe handle for `/projects/<slug>`. */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "project"
  );
}

/** `/projects/<slug>` — the case-study route the card's CTA points at. */
export function projectHref(slug: string): string {
  return `/projects/${slug}`;
}

/** The admin's chosen shot, else the first uploaded one, else nothing. */
export function pickShowcaseImage(project: {
  showcase_image_id: string | null;
  images: ProjectImageRow[];
}): ProjectImageRow | null {
  const images = [...(project.images ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );
  const chosen = images.find((image) => image.id === project.showcase_image_id);
  return chosen ?? images[0] ?? null;
}

/** Category suggestions offered on the admin form (freeform underneath). */
export const DEFAULT_CATEGORIES = [
  "Full Stack",
  "AI Agent",
  "Web App",
  "AI + RAG",
  "Automation",
] as const;

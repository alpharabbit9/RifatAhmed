/**
 * Shared constants + pure helpers for the Hero / Profile feature.
 *
 * Deliberately its own module: `actions.ts` is a `"use server"` file, and
 * everything exported from one of those becomes a callable RPC endpoint (so it
 * may only export async functions). The bucket name, the limits and the
 * name-splitting helper are needed by the server action, the admin form and
 * the public hero alike, so they live here where every side can import them.
 */

/** Hero images share the projects bucket (created by migration 0004). */
export const MEDIA_BUCKET = "media";

/** The portrait is a large alpha PNG — the artwork behind it larger still. */
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  // Only the single admin can upload, and the file is served from the
  // Supabase Storage origin rather than this one.
  "image/svg+xml",
] as const;

/** Beyond two the eyebrow slot cycles for longer than anyone waits. */
export const MAX_ROLE_LABELS = 4;

/** The rolling quote block is one line tall; more words just delay the loop. */
export const MAX_QUOTE_WORDS = 6;

/** Two extruded lines fill the column; a third would reach the fold. */
export const MAX_NAME_LINES = 3;

/** The three uploadable images on the hero, keyed as they are in storage. */
export const HERO_IMAGE_KINDS = ["portrait", "artwork", "logo"] as const;
export type HeroImageKind = (typeof HERO_IMAGE_KINDS)[number];

/** Shipped with the repo — used until an upload replaces them. */
export const FALLBACK_PORTRAIT = "/images/hero.png";
export const FALLBACK_ARTWORK = "/images/art-bg-alpha.png";
export const FALLBACK_LOGO = "/images/logo.png";

/**
 * `name` stores one display line per newline. Blank lines are dropped so a
 * stray trailing return can't push an empty extruded stack onto the page.
 */
export function nameLines(name: string): string[] {
  return name
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_NAME_LINES);
}

/**
 * Next/Image can't run an SVG through the optimizer unless
 * `dangerouslyAllowSVG` is on, and an uploaded logo is routinely SVG. Passing
 * those through untouched keeps both kinds of file working without loosening
 * the config for every remote image. (Mirrors `isVectorLogo` in
 * `features/career/constants.ts` — same reason, different section.)
 */
export function isVectorImage(url: string): boolean {
  return /\.svg(\?|$)/i.test(url);
}

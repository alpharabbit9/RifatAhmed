/**
 * Phase 9 — one source of truth for the site's identity and its origin.
 *
 * Every absolute URL the site emits (Open Graph images, canonicals, the
 * sitemap, `robots.txt`) has to agree on where the site lives, and none of
 * them can ask the browser — they are all produced on the server. So the
 * origin is resolved once, here, in this order:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — set this in Vercel (or `.env.local`) once the
 *      real domain is attached. It wins over everything, which is what makes
 *      a custom domain behave: Vercel's own variable below always points at
 *      the `*.vercel.app` deployment, never at the domain in front of it.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — the production deployment's host,
 *      injected by Vercel with no scheme. Keeps previews and the first deploy
 *      honest before a domain exists.
 *   3. `http://localhost:3000` — local dev.
 *
 * Note the trailing slash is stripped, so `absoluteUrl("/projects")` never
 * produces a doubled one.
 */

const FALLBACK_ORIGIN = "http://localhost:3000";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return FALLBACK_ORIGIN;
}

/** Origin only — no trailing slash, no path. */
export const SITE_URL = resolveSiteUrl();

/** Used as the Open Graph `siteName` and in the title template. */
export const SITE_NAME = "Rifat Ahmed";

export const SITE_TITLE =
  "Rifat Ahmed — Full Stack Developer & AI Agent Builder";

export const SITE_DESCRIPTION =
  "Portfolio of Rifat Ahmed — a full stack developer and AI agent builder. Case studies, career, services and the certificates behind them.";

/** `absoluteUrl("/projects")` → `https://example.com/projects`. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Trims a body of copy down to something a `<meta name="description">` can
 * carry: one line, no runaway length, cut on a word boundary with an ellipsis
 * rather than mid-word.
 *
 * Search results truncate around 155-160 characters, so that is the budget.
 */
export function toMetaDescription(
  value: string | null | undefined,
  limit = 158,
): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (text.length <= limit) return text;

  const clipped = text.slice(0, limit - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped).replace(/[.,;:—-]$/, "")}…`;
}

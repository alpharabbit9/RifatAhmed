/**
 * Shared constants + pure helpers for the Career Journey feature.
 *
 * Deliberately its own module: `actions.ts` is a `"use server"` file, and
 * everything exported from one of those becomes a callable RPC endpoint (so it
 * may only export async functions). The bucket name, the limits and the date
 * formatting are needed by the server actions, the admin form and the public
 * timeline alike, so they live here where every side can import them.
 */

/** Logos share the projects bucket (created by migration 0004). */
export const MEDIA_BUCKET = "media";

export const MAX_HIGHLIGHTS = 6;
export const MAX_SKILLS = 12;
/** A logo is a logo — anything larger is a screenshot by mistake. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  // Company logos are usually vector. Only the single admin can upload, and
  // the file is served from the Supabase Storage origin rather than this one.
  "image/svg+xml",
] as const;

/** Offered on the admin form as suggestions; the field stays freeform. */
export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Postgres `date` arrives as `YYYY-MM-DD`. Parsed by hand rather than through
 * `new Date()` so a browser in a negative UTC offset can't shift "2023-01-01"
 * back into December.
 */
function parseDate(value: string | null): { year: number; month: number } | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;

  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { year: Number(match[1]), month };
}

/** "2023-01-01" → "Jan 2023". */
export function formatMonth(value: string | null): string {
  const parsed = parseDate(value);
  return parsed ? `${MONTHS[parsed.month - 1]} ${parsed.year}` : "";
}

/**
 * The period label under a role. A missing end date means the role is current
 * ("Present"); a missing start date degrades to whatever half exists.
 */
export function formatPeriod(
  start: string | null,
  end: string | null,
): string {
  const from = formatMonth(start);
  const to = end ? formatMonth(end) : "Present";

  if (!from) return end ? to : "";
  return `${from} — ${to}`;
}

/** "1 yr 6 mos" — LinkedIn's shorthand. Empty when the start date is unset. */
export function formatDuration(
  start: string | null,
  end: string | null,
): string {
  const from = parseDate(start);
  if (!from) return "";

  const now = new Date();
  const to = parseDate(end) ?? {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };

  // Inclusive of both end months, so Jan→Jan reads as "1 mo", not "0 mos".
  const months =
    (to.year - from.year) * 12 + (to.month - from.month) + 1;
  if (months < 1) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (rest > 0) parts.push(`${rest} mo${rest > 1 ? "s" : ""}`);

  return parts.join(" ");
}

/** `date` column → the value an `<input type="month">` expects. */
export function toMonthInput(value: string | null): string {
  const parsed = parseDate(value);
  return parsed
    ? `${parsed.year}-${String(parsed.month).padStart(2, "0")}`
    : "";
}

/** `<input type="month">` → the 1st of that month, or null when cleared. */
export function fromMonthInput(value: string): string | null {
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : null;
}

/**
 * Next/Image can't run an SVG through the optimizer unless
 * `dangerouslyAllowSVG` is on, and company logos are routinely SVG (the seeded
 * Samstop mark included). Passing those through untouched keeps both kinds of
 * file working without loosening the config for every remote image.
 */
export function isVectorLogo(url: string): boolean {
  return /\.svg(\?|$)/i.test(url);
}

/**
 * Shared constants + pure helpers for the Achievements feature.
 *
 * Its own module for the same reason `features/services/constants.ts` is:
 * `actions.ts` is a `"use server"` file, and everything exported from one of
 * those becomes a callable RPC endpoint, so it may only export async
 * functions. The bucket name, the limits and the date formatting are needed by
 * the server actions, the admin form and the public wall alike.
 */

/** Certificate scans share the media bucket (created by migration 0004). */
export const MEDIA_BUCKET = "media";

export const MAX_TITLE_LENGTH = 140;

/**
 * Past this the wall stops being a gallery and starts being a filing cabinet.
 * Twelve fills three full rows of four on the widest breakpoint.
 */
export const MAX_ACHIEVEMENTS = 12;

/** A certificate scan is a page, not a photoshoot. */
export const MAX_CERTIFICATE_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_CERTIFICATE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
] as const;

/**
 * The frame's inner opening. A-series landscape (√2), which is what a
 * certificate is actually printed on — so a real scan fills the mat instead of
 * floating in it.
 */
export const CERTIFICATE_ASPECT = 1.414;

/** Category suggestions offered on the admin form (freeform underneath). */
export const DEFAULT_CATEGORIES = [
  "Cloud",
  "Frontend",
  "Backend",
  "AI",
  "Engineering",
  "Data",
  "Design",
  "Security",
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
 * `new Date()` so a browser in a negative UTC offset can't shift "2024-05-01"
 * back into April.
 */
function parseDate(value: string | null): { year: number; month: number } | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;

  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { year: Number(match[1]), month };
}

/** "2024-05-01" → "May 2024". Blank when the date is unset. */
export function formatIssued(value: string | null): string {
  const parsed = parseDate(value);
  return parsed ? `${MONTHS[parsed.month - 1]} ${parsed.year}` : "";
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
 * Alt text for a certificate scan. Written here rather than at the call site
 * so the wall, the viewer and the admin thumbnail can't describe the same
 * image three different ways.
 */
export function certificateAlt(
  achievement: { title: string; issuer: string },
  holder: string,
): string {
  const from = achievement.issuer ? ` from ${achievement.issuer}` : "";
  return `${achievement.title} certificate${from}, earned by ${holder}`;
}

/**
 * Splits a heading around the words the section sets in burgundy.
 *
 * The accent is stored as a substring of the heading (migration 0011) rather
 * than as a second column, so the two can never disagree about what the
 * heading says. A match that isn't found returns the whole heading as one
 * un-accented part, which is the correct degradation: the words are still
 * right, they are just all cream.
 */
export function splitHeadingAccent(
  heading: string,
  accent: string,
): { text: string; accented: boolean }[] {
  const needle = accent.trim();
  if (!needle) return [{ text: heading, accented: false }];

  const at = heading.toLowerCase().indexOf(needle.toLowerCase());
  if (at === -1) return [{ text: heading, accented: false }];

  return [
    { text: heading.slice(0, at), accented: false },
    // Sliced out of the heading, not out of the accent column, so the casing
    // on screen is always the heading's own.
    { text: heading.slice(at, at + needle.length), accented: true },
    { text: heading.slice(at + needle.length), accented: false },
  ].filter((part) => part.text.length > 0);
}

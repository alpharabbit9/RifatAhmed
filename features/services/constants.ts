/**
 * Shared constants + pure helpers for the Services feature.
 *
 * Its own module for the same reason `features/career/constants.ts` is:
 * `actions.ts` is a `"use server"` file, and everything exported from one of
 * those becomes a callable RPC endpoint, so it may only export async
 * functions. The limits below are needed by the server actions, the admin form
 * and the public section alike.
 */

/** Deliverables beyond this stop being a list and start being a page. */
export const MAX_DELIVERABLES = 6;

export const MAX_TITLE_LENGTH = 120;

/** Services beyond this stop reading as a menu and start reading as a plea. */
export const MAX_SERVICES = 8;

/**
 * The public row shows its ordinal ("01", "02", …). Zero-padded so the numbers
 * stay the same width down the column and the titles line up.
 */
export function formatOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

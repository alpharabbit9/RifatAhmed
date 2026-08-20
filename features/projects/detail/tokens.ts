/**
 * The handful of raw colour values the case-study page repeats.
 *
 * They are CSS `color-mix()` strings rather than Tailwind classes because
 * they are all *derived* from the two brand colours, and Tailwind v4 arbitrary
 * values can't nest a `var()` inside a mix without going unreadable.
 *
 * Why a tint at all: pure `#5B0F18` on `#0B0B0B` is barely above black, so
 * anything that has to *read* at small sizes (the subtitle, feature icons, the
 * active thumbnail border) uses burgundy pulled toward cream. Fills and
 * surfaces stay true burgundy — see Design_System.md §4.
 */

/** Burgundy lightened toward cream — for type and icons that must read. */
export const ACCENT_TINT =
  "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

/** A shade darker than `ACCENT_TINT` — active borders, rules, dots. */
export const ACCENT_BORDER =
  "color-mix(in srgb, var(--primary) 72%, var(--foreground))";

/** Burgundy at low opacity — icon squares, the closing section's ground. */
export const ACCENT_WASH = "rgba(91, 15, 24, 0.18)";

/** §28 — structural borders. */
export const BORDER_PRIMARY = "rgba(248, 241, 231, 0.20)";
export const BORDER_SUBTLE = "rgba(248, 241, 231, 0.10)";
export const BORDER_FRAME = "rgba(248, 241, 231, 0.25)";

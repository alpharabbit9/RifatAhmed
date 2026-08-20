/**
 * Rifat Ahmed Portfolio — raw design tokens.
 *
 * Source-of-truth hex values from `Design_System.md`. These mirror the CSS
 * variables in `styles/globals.css`. Import them when you need a color in
 * JS/TS (charts, canvas, inline styles) rather than a Tailwind class. For
 * styling, prefer the Tailwind utilities (`bg-surface`, `text-primary`).
 */
export const colors = {
  // ── Neutrals · deep black ────────────────────────────────────────────────
  background: "#0B0B0B", // main page/hero background
  surface: "#111111", // panels / cards
  surfaceElevated: "#171515", // nested / hovered surfaces

  // ── Brand · burgundy wine ────────────────────────────────────────────────
  primary: "#5B0F18", // primary CTA, active states, highlights
  primaryHover: "#741522",
  primaryForeground: "#F8F1E7", // text on burgundy fills

  accent: "#5B0F18",
  accentSoft: "rgba(91, 15, 24, 0.18)", // pill / badge / active-nav backgrounds

  // ── Text ────────────────────────────────────────────────────────────────
  foreground: "#F8F1E7", // soft cream — headings & primary text
  foregroundMuted: "#D8CEC1", // body / supporting copy
  foregroundSubtle: "#A49C93", // captions, metadata, disabled

  // ── Borders + overlay ───────────────────────────────────────────────────
  border: "#302D2B",
  borderLight: "rgba(248, 241, 231, 0.12)",
  overlay: "rgba(11, 11, 11, 0.82)",
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  card: "18px",
  xl: "20px",
  large: "24px",
  pill: "9999px",
} as const;

export const shadows = {
  card: "0 20px 60px rgba(0, 0, 0, 0.35)",
  burgundyGlow: "0 0 60px rgba(91, 15, 24, 0.18)",
} as const;

export const fonts = {
  display: "var(--font-display)", // Brunson — heavy editorial display
  sans: "var(--font-sans)", // Inter — UI / body
  editorial: "var(--font-editorial)", // Cormorant Garamond — accent quotes
} as const;

export type ColorToken = keyof typeof colors;

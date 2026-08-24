/**
 * Phase 9 — the shared Open Graph card.
 *
 * Every `opengraph-image.tsx` on the site renders this one component, so a
 * link to the home page, to `/projects`, to a case study and to the
 * certificate wall all arrive in a chat window looking like the same site:
 * black ground, a burgundy wash off the top-right corner, a hairline rule, the
 * headline in Brunson and the labels in Inter — the site's own type pairing.
 *
 * Two constraints shape the markup, both from Satori (the renderer behind
 * `next/og`):
 *
 *   - Only flexbox. Every element with more than one child declares
 *     `display: "flex"` explicitly — Satori has no block layout to fall back
 *     on and throws when it finds bare children.
 *   - No `text-transform`. Brunson has no lowercase glyphs at all (so caps are
 *     the only thing it can draw), and Satori would otherwise measure the
 *     lowercase string. The strings are uppercased in JS on the way in.
 *
 * Fonts are read off disk at request time rather than fetched: a social
 * scraper hits these routes once, cold, and a network round trip to a font CDN
 * inside that request is one more thing that can time out. `next.config.ts`
 * traces the files into the serverless bundle (`outputFileTracingIncludes`),
 * and `loadOgFonts` degrades one face at a time — a card in a fallback face is
 * a far better outcome than a route that 500s and leaves the link with no
 * image at all.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The size every social platform crops from — 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 };

export const OG_CONTENT_TYPE = "image/png";

/* Design_System.md §Primary Palette. */
const BLACK = "#0B0B0B";
const CREAM = "#F8F1E7";
const BURGUNDY = "#5B0F18";
const CREAM_MUTED = "rgba(248, 241, 231, 0.68)";
const CREAM_FAINT = "rgba(248, 241, 231, 0.44)";
const HAIRLINE = "rgba(248, 241, 231, 0.16)";

const FONT_FILES: { file: string; name: string; weight: 400 | 600 }[] = [
  { file: "Brunson.ttf", name: "Brunson", weight: 400 },
  { file: "Inter-Regular.ttf", name: "Inter", weight: 400 },
  { file: "Inter-SemiBold.ttf", name: "Inter", weight: 600 },
];

/** One face, read from `public/fonts`, in the shape `ImageResponse` wants. */
async function loadFont(file: string, name: string, weight: 400 | 600) {
  const data = await readFile(join(process.cwd(), "public", "fonts", file));
  return { name, data, weight, style: "normal" as const };
}

/**
 * Inferred rather than written out: `readFile`'s buffer type has changed
 * shape across `@types/node` releases, and `ImageResponse` is strict about it.
 */
type OgFont = Awaited<ReturnType<typeof loadFont>>;

/**
 * The three faces the card uses, as `ImageResponse` font entries.
 *
 * Returns `undefined` only if *every* file failed, which is the signal for
 * `ImageResponse` to fall back to its own embedded face. A partial result is
 * passed through as-is: losing Brunson should not also cost us Inter.
 */
export async function loadOgFonts(): Promise<OgFont[] | undefined> {
  const results = await Promise.all(
    FONT_FILES.map(async ({ file, name, weight }) => {
      try {
        return await loadFont(file, name, weight);
      } catch (error) {
        console.error(`[og] ${file} unavailable:`, error);
        return null;
      }
    }),
  );

  const fonts = results.filter((font): font is OgFont => font !== null);
  return fonts.length > 0 ? fonts : undefined;
}

/**
 * Long titles have to shrink or they run out of card. Four steps rather than a
 * continuous scale: the jumps land on sizes that were checked by eye.
 */
function titleSize(title: string): number {
  if (title.length <= 22) return 92;
  if (title.length <= 40) return 74;
  if (title.length <= 62) return 58;
  return 48;
}

/** One line, no runaway length — the card has room for about two. */
function clamp(value: string | undefined, limit: number): string {
  const text = value?.replace(/\s+/g, " ").trim() ?? "";
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}

export interface OgCardProps {
  /** Small burgundy-ruled label above the title — "PROJECT", "PORTFOLIO"… */
  eyebrow: string;
  /** The headline, set in Brunson. Uppercased here. */
  title: string;
  /** One or two lines of body copy under the headline. */
  subtitle?: string;
  /** The bottom-left line — tech stack, a count, a role. */
  footnote?: string;
  /** Bottom-right wordmark. Defaults to the site owner. */
  wordmark?: string;
}

export function OgCard({
  eyebrow,
  title,
  subtitle,
  footnote,
  wordmark = "Rifat Ahmed",
}: OgCardProps) {
  const headline = title.toUpperCase();
  const foot = clamp(footnote, 64).toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: BLACK,
        // The burgundy wash, thrown from off the top-right corner.
        backgroundImage:
          "radial-gradient(900px 620px at 92% -14%, rgba(91, 15, 24, 0.62), rgba(11, 11, 11, 0) 62%)",
        padding: 56,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          border: `1px solid ${HAIRLINE}`,
          borderRadius: 10,
          padding: "48px 56px",
        }}
      >
        {/* ---------------- Eyebrow ---------------- */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 2,
              backgroundColor: BURGUNDY,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 4,
              color: CREAM_MUTED,
            }}
          >
            {eyebrow.toUpperCase()}
          </div>
        </div>

        {/* ---------------- Headline + standfirst ---------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Brunson",
              fontSize: titleSize(headline),
              lineHeight: 1,
              letterSpacing: 1,
              color: CREAM,
              maxWidth: 980,
            }}
          >
            {headline}
          </div>

          {subtitle ? (
            <div
              style={{
                display: "flex",
                fontSize: 27,
                lineHeight: 1.45,
                color: CREAM_MUTED,
                maxWidth: 800,
              }}
            >
              {clamp(subtitle, 130)}
            </div>
          ) : null}
        </div>

        {/* ---------------- Footer ---------------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 2.5,
              color: CREAM_FAINT,
            }}
          >
            {foot}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                width: 9,
                height: 9,
                borderRadius: 9,
                backgroundColor: BURGUNDY,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: 3,
                color: CREAM,
              }}
            >
              {wordmark.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

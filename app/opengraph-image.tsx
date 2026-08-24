/**
 * The site's Open Graph card — what a link to `/` unfurls as, and the default
 * every route without its own `opengraph-image` inherits.
 *
 * It reads the live profile rather than hardcoding the name and tagline: the
 * card that gets pasted into a chat should say whatever `/admin/hero` says
 * today. The read falls back to `DEFAULT_PROFILE` on its own (see
 * `features/hero/data.ts`), so this route never depends on the migration
 * having been applied.
 */

import { ImageResponse } from "next/og";
import { getProfile } from "@/features/hero/data";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

export const alt = "Rifat Ahmed — Full Stack Developer & AI Agent Builder";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage() {
  const [profile, fonts] = await Promise.all([getProfile(), loadOgFonts()]);

  // `profile.name` is stored one display line per newline.
  const name =
    profile.name
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ") || "Rifat Ahmed";

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Portfolio"
        title={name}
        subtitle={profile.tagline}
        footnote={profile.role_labels.join(" · ")}
        wordmark={name}
      />
    ),
    { ...OG_SIZE, fonts },
  );
}

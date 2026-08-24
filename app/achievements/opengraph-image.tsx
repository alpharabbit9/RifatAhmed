/**
 * The Open Graph card for `/achievements`.
 *
 * Section copy comes from the same admin-managed row the page renders, so the
 * card restates whatever the wall currently says rather than a second, stale
 * headline written here.
 */

import { ImageResponse } from "next/og";
import {
  getAchievements,
  getAchievementsSection,
} from "@/features/achievements/data";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

export const alt = "Certifications and achievements earned by Rifat Ahmed";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function AchievementsOpengraphImage() {
  const [section, achievements, fonts] = await Promise.all([
    getAchievementsSection(),
    getAchievements(),
    loadOgFonts(),
  ]);

  const count = achievements.length;

  return new ImageResponse(
    (
      <OgCard
        eyebrow={section.eyebrow || "Achievements"}
        title={section.heading}
        subtitle={section.standfirst}
        footnote={`${count} ${count === 1 ? "certificate" : "certificates"}`}
      />
    ),
    { ...OG_SIZE, fonts },
  );
}

/**
 * The Open Graph card for the `/projects` archive.
 *
 * Counting the published set on the card is the point: a link to the archive
 * should say how much is behind it, the same way the page's own header does.
 */

import { ImageResponse } from "next/og";
import { getShowcaseProjects } from "@/features/projects/data";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

export const alt = "All projects by Rifat Ahmed";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ProjectsOpengraphImage() {
  const [projects, fonts] = await Promise.all([
    getShowcaseProjects(),
    loadOgFonts(),
  ]);

  const count = projects.length;

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Project Archive"
        title="All Projects"
        subtitle="Client builds, AI agents and things made to scratch my own itch — each with its own case study."
        footnote={`${count} ${count === 1 ? "project" : "projects"} published`}
      />
    ),
    { ...OG_SIZE, fonts },
  );
}

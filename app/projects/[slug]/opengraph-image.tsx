/**
 * Per-project Open Graph card — PLAN.md phase 9's "per-project OG images".
 *
 * Typeset rather than photographic on purpose. A case study's own screenshots
 * are cropped for a 16:9 frame inside a dark page; dropped into a 1.91:1
 * social card they arrive letterboxed and unreadable at thumbnail size. The
 * title and category survive that crop, so those are what the card carries.
 *
 * A slug with no project still renders a card rather than 500ing — the page
 * itself will 404, and a scraper that got here first should not be handed an
 * error image.
 */

import { ImageResponse } from "next/og";
import { getCaseStudyProject } from "@/features/projects/data";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, loadOgFonts } from "@/lib/og";

export const alt = "Project case study by Rifat Ahmed";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, fonts] = await Promise.all([
    getCaseStudyProject(slug),
    loadOgFonts(),
  ]);

  if (!project) {
    return new ImageResponse(
      (
        <OgCard
          eyebrow="Project"
          title="Case Study"
          subtitle="This project is no longer published."
        />
      ),
      { ...OG_SIZE, fonts },
    );
  }

  // The stack is the most useful thing a recruiter can read at thumbnail size;
  // the year anchors it. `OgCard` clamps the line, so an eight-item stack is
  // cut rather than wrapped.
  const footnote = [project.techStack.slice(0, 4).join(" · "), project.year]
    .filter(Boolean)
    .join("  —  ");

  return new ImageResponse(
    (
      <OgCard
        eyebrow={project.category || "Project"}
        title={project.title}
        subtitle={project.subtitle || project.description}
        footnote={footnote}
      />
    ),
    { ...OG_SIZE, fonts },
  );
}

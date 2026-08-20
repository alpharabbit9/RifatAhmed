/**
 * The case-study page itself — `/projects/<slug>` in one composition.
 *
 * Fully data-driven (§34): every string, image, link and icon arrives on the
 * `project` prop, so the same component renders CareerLogic AI, a RAG system
 * or an automation build with no branching on which project it is. Sections
 * with nothing to say remove themselves rather than rendering an empty shell.
 *
 * The composition, top to bottom (UI-Section-Examples/Project-Details.png):
 *
 *   ┌ framed shell — 1px cream hairline, 20px radius, 16px from the viewport ┐
 *   │  back link · badge · title · subtitle · copy · metadata │ screenshot   │
 *   │                                                          gallery strip │
 *   │  ─────────────────────────────────────────────────────────────────────│
 *   │  ABOUT THE PROJECT │ KEY FEATURES │ TECH STACK + PROJECT HIGHLIGHTS    │
 *   │  ┌ CHALLENGE │ SOLUTION │ IMPACT ─ burgundy-tinted panel ────────────┐ │
 *   │  closing CTA                                                          │
 *   └───────────────────────────────────────────────────────────────────────┘
 *
 * A Server Component: only the gallery (state) and the feature list (stagger)
 * ship JavaScript, plus the `<Rise>` wrappers that fade each band in (§31).
 *
 * Responsive (§24): the hero splits at `lg`, the information columns at `lg`,
 * the closing panel at `md`. Below those every band is a single column in the
 * order the reference lists, and nothing scrolls sideways — the only
 * horizontal scroll on the page is inside the thumbnail strip.
 *
 * Note there is no left sidebar: the reference's only vertical nav is the one
 * *inside* the CareerLogic dashboard screenshot. The page's navigation is the
 * back link at the top and the CTA at the bottom.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rise } from "@/features/projects/detail/motion";
import { ProjectAbout } from "@/features/projects/detail/project-about";
import { ProjectFeatures } from "@/features/projects/detail/project-features";
import { ProjectGallery } from "@/features/projects/detail/project-gallery";
import { ProjectHighlights } from "@/features/projects/detail/project-highlights";
import { BackToProjects, ProjectHero } from "@/features/projects/detail/project-hero";
import { ProjectStory } from "@/features/projects/detail/project-story";
import { ProjectTechStack } from "@/features/projects/detail/project-tech-stack";
import {
  BORDER_FRAME,
  BORDER_SUBTLE,
} from "@/features/projects/detail/tokens";
import type { CaseStudyProject } from "@/features/projects/types";

/** The vertical rule between the information columns, `lg` and up (§28). */
const COLUMN_DIVIDER =
  "lg:border-l lg:border-[rgba(248,241,231,0.10)] lg:pl-[clamp(24px,2.6vw,44px)]";

/**
 * The information band is however many columns actually have content.
 *
 * A project written before `0005_project_case_study.sql` was applied has no
 * ABOUT paragraphs, and a fixed `lg:grid-cols-3` would then leave a divider
 * hanging on the left of the band with nothing beside it and a third of the
 * row empty. Counting first keeps two columns looking deliberate.
 */
const COLUMN_TRACKS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

function ClosingCta({ project }: { project: CaseStudyProject }) {
  return (
    <div
      className="mt-[clamp(36px,4vw,60px)] flex flex-wrap items-center justify-between gap-6 border-t pt-[clamp(24px,2.6vw,36px)]"
      style={{ borderColor: BORDER_SUBTLE }}
    >
      <BackToProjects />

      <div className="flex flex-wrap items-center gap-3">
        {project.liveDemo && (
          <a
            href={project.liveDemo}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group/cta ring-brand inline-flex h-11 items-center gap-2 rounded-full px-5",
              "border border-[rgba(248,241,231,0.28)] font-sans text-[13.5px] font-semibold text-foreground",
              "transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground",
            )}
          >
            Visit {project.title}
            <ArrowUpRight
              aria-hidden
              className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1"
              strokeWidth={2}
            />
          </a>
        )}

        <Link
          href="/#contact"
          className={cn(
            "group/cta ring-brand inline-flex h-11 items-center gap-2 rounded-full px-5",
            "bg-primary font-sans text-[13.5px] font-semibold text-primary-foreground",
            "transition-colors duration-300 hover:bg-primary-hover",
          )}
        >
          Start a project
          <ArrowUpRight
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1"
            strokeWidth={2}
          />
        </Link>
      </div>
    </div>
  );
}

export function ProjectCaseStudy({ project }: { project: CaseStudyProject }) {
  const columns = [
    project.about.length > 0 && (
      <ProjectAbout key="about" paragraphs={project.about} />
    ),
    project.features.length > 0 && (
      <ProjectFeatures key="features" features={project.features} />
    ),
    (project.techStack.length > 0 || project.highlights.length > 0) && (
      <div
        key="stack"
        className="flex min-w-0 flex-col gap-[clamp(28px,3vw,40px)]"
      >
        <ProjectTechStack technologies={project.techStack} />
        <ProjectHighlights highlights={project.highlights} />
      </div>
    ),
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-background p-2.5 sm:p-3.5 lg:p-4">
      <div
        className={cn(
          "mx-auto w-full max-w-[1600px] rounded-[20px] border bg-background",
          "px-[clamp(18px,2.6vw,44px)] py-[clamp(22px,2.4vw,38px)]",
        )}
        style={{ borderColor: BORDER_FRAME }}
      >
        {/* ── Hero: story left, screenshot right (§10) ─────────────────── */}
        <div
          className={cn(
            "grid gap-[clamp(28px,3vw,44px)]",
            "lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] lg:items-stretch",
          )}
        >
          <Rise className="min-w-0">
            <ProjectHero project={project} />
          </Rise>

          <Rise delay={0.12} className="min-w-0">
            <ProjectGallery images={project.gallery} title={project.title} />
          </Rise>
        </div>

        {/* ── Three information columns (§17) ──────────────────────────── */}
        {columns.length > 0 && (
          <Rise delay={0.2}>
            <hr
              className="my-[clamp(36px,4.5vw,64px)] border-t"
              style={{ borderColor: BORDER_SUBTLE }}
            />

            <div
              className={cn(
                "grid gap-[clamp(32px,3vw,44px)] lg:gap-0",
                COLUMN_TRACKS[columns.length],
              )}
            >
              {columns.map((column, position) => (
                <div
                  key={position}
                  className={cn(
                    "min-w-0",
                    position === 0
                      ? "lg:pr-[clamp(24px,2.6vw,44px)]"
                      : COLUMN_DIVIDER,
                    // Middle columns need breathing room on both sides.
                    position > 0 &&
                      position < columns.length - 1 &&
                      "lg:pr-[clamp(24px,2.6vw,44px)]",
                  )}
                >
                  {column}
                </div>
              ))}
            </div>
          </Rise>
        )}

        {/* ── Challenge / Solution / Impact (§22) ──────────────────────── */}
        <Rise delay={0.26}>
          <ProjectStory
            project={project}
            className="mt-[clamp(36px,4.5vw,64px)]"
          />

          <ClosingCta project={project} />
        </Rise>
      </div>
    </main>
  );
}

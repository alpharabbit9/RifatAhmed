/**
 * The case study's left column — back link, category badge, the display title,
 * the burgundy kicker, the description and the metadata row (§8–§14).
 *
 * A Server Component wrapped in the page's `<Rise>` ladder by its parent; the
 * only motion here is the back arrow's 3px nudge, which is CSS.
 *
 * The title is set in Brunson at `clamp(3rem, 5.5vw, 6.5rem)`. It renders in
 * caps: Brunson is a caps-only face — its lowercase codepoints map to capital
 * forms, so the mixed-case title in the reference mockup is not reachable with
 * the portfolio's display font, and the page matches the hero and the project
 * card instead.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectMetadata } from "@/features/projects/detail/project-metadata";
import { ACCENT_TINT } from "@/features/projects/detail/tokens";
import type { CaseStudyProject } from "@/features/projects/types";

export function BackToProjects({ className }: { className?: string }) {
  return (
    <Link
      href="/#projects"
      className={cn(
        "group/back ring-brand inline-flex items-center gap-2 rounded-sm",
        "font-sans text-[13.5px] font-medium transition-colors",
        "hover:text-foreground",
        className,
      )}
      style={{ color: ACCENT_TINT }}
    >
      <ArrowLeft
        aria-hidden
        className="h-4 w-4 transition-transform duration-300 ease-out group-hover/back:-translate-x-1"
        strokeWidth={2}
      />
      Back to Projects
    </Link>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-[8px] bg-primary px-3.5",
        "font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground",
      )}
    >
      <span aria-hidden className="h-[5px] w-[5px] rounded-full bg-primary-foreground" />
      {category}
    </span>
  );
}

export function ProjectHero({ project }: { project: CaseStudyProject }) {
  return (
    // `h-full` so the metadata row's `lg:mt-auto` has a column height to push
    // against — the grid stretches this item to the height of the gallery.
    <div className="flex h-full min-w-0 flex-col">
      <BackToProjects />

      {project.category && (
        <div className="mt-[clamp(24px,3vh,38px)]">
          <CategoryBadge category={project.category} />
        </div>
      )}

      <h1
        className={cn(
          "mt-[clamp(16px,2.2vh,26px)] font-display text-foreground",
          "text-[clamp(3rem,5.5vw,6.5rem)] leading-[0.92]",
        )}
      >
        {project.title}
      </h1>

      {project.subtitle && (
        <p
          className="mt-[clamp(10px,1.6vh,18px)] font-sans text-[clamp(1rem,1.4vw,1.375rem)] font-semibold uppercase tracking-[0.08em]"
          style={{ color: ACCENT_TINT }}
        >
          {project.subtitle}
        </p>
      )}

      {project.description && (
        <p className="mt-[clamp(18px,2.4vh,28px)] max-w-[550px] font-sans text-[17px] leading-[1.6] text-[rgba(248,241,231,0.70)] sm:text-[17.5px]">
          {project.description}
        </p>
      )}

      {/* Pushed to the bottom of the column on desktop, so the row sits level
          with the gallery strip beside it however tall the copy runs. */}
      <ProjectMetadata
        project={project}
        className="mt-[clamp(28px,4vh,52px)] lg:mt-auto lg:pt-[clamp(24px,3vh,40px)]"
      />
    </div>
  );
}

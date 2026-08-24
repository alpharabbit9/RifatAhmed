/**
 * The `/projects` archive — every published project as a card.
 *
 * The home page's Projects section is the *edit*: only the featured set, one
 * full-screen case-study preview at a time. This is the *index*: everything
 * that has been published, in a scannable grid, reached from the navbar.
 * Both read the same `ShowcaseProject` shape, so a project never says one
 * thing here and another there.
 *
 * A Server Component — the only JavaScript on the page comes from the pieces
 * that need it (`<RollingText>`, `<Reveal>`, `<ProjectGridCard>`).
 *
 * The header follows the section conventions used across the site: numbered
 * eyebrow, rolling display heading, short standfirst — so the archive reads as
 * another chapter of the same document rather than a different site.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { RollingText } from "@/components/motion/rolling-text";
import { Reveal } from "@/components/motion/scroll-reveal";
import { ProjectGridCard } from "@/features/projects/project-grid-card";
import type { ShowcaseProject } from "@/features/projects/types";

/** Editorial container per Design_System.md §8 — the same one the sections use. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/** Burgundy pulled toward cream — see `detail/tokens.ts`. */
const ACCENT_TINT = "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

function BackToHome() {
  return (
    <Link
      href="/#home"
      className={cn(
        "group/back ring-brand inline-flex items-center gap-2 rounded-sm",
        "font-sans text-[13.5px] font-medium transition-colors hover:text-foreground",
      )}
      style={{ color: ACCENT_TINT }}
    >
      <ArrowLeft
        aria-hidden
        className="h-4 w-4 transition-transform duration-300 ease-out group-hover/back:-translate-x-1"
        strokeWidth={2}
      />
      Back to Home
    </Link>
  );
}

function EmptyState() {
  return (
    <div
      className={cn(
        "mt-14 rounded-[20px] border border-dashed border-[rgba(248,241,231,0.18)]",
        "px-8 py-16 text-center",
      )}
    >
      <p className="font-display text-[clamp(1.4rem,3vw,2rem)] uppercase text-foreground">
        Nothing published yet
      </p>
      <p className="mt-3 font-sans text-[14.5px] leading-[1.7] text-foreground-muted">
        New work goes up here as soon as it ships.
      </p>
    </div>
  );
}

export function ProjectsIndex({ projects }: { projects: ShowcaseProject[] }) {
  const featuredCount = projects.filter((project) => project.featured).length;

  // Reads as one sentence of provenance under the heading, and skips the
  // featured half entirely when nothing is flagged.
  const summary = [
    `${projects.length} ${projects.length === 1 ? "project" : "projects"}`,
    featuredCount > 0 ? `${featuredCount} featured on the home page` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* Clears the fixed 80px navbar, then opens with the page's own header. */}
      <section className={cn(CONTAINER, "pb-[clamp(40px,5vw,72px)] pt-[clamp(130px,15vh,190px)]")}>
        <Reveal amount={0.4} distance={14}>
          <BackToHome />
        </Reveal>

        <Reveal amount={0.4} delay={0.05} distance={16}>
          <p className="mt-8 flex items-center gap-4">
            <span className="font-display text-[13px] leading-none text-primary">
              04
            </span>
            <span className="h-px w-10 bg-primary/60" />
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Project Archive
            </span>
          </p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <RollingText
            as="h1"
            text="All Projects"
            className={cn(
              "font-display uppercase text-foreground",
              "text-[clamp(2.8rem,7vw,5.4rem)] leading-[0.96] tracking-[0.008em]",
            )}
          />

          <Reveal delay={0.1} distance={14}>
            <p className="max-w-[46ch] font-sans text-[clamp(0.98rem,1.2vw,1.08rem)] leading-[1.7] text-foreground-muted">
              Everything I have shipped and written up — client builds, AI
              agents and things made to scratch my own itch. Open any card for
              the full case study.
            </p>
          </Reveal>
        </div>

        {projects.length > 0 && (
          <Reveal delay={0.15} amount={0.4} distance={12}>
            <p className="mt-8 border-t border-[rgba(248,241,231,0.12)] pt-5 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {summary}
            </p>
          </Reveal>
        )}
      </section>

      <section className={cn(CONTAINER, "pb-[clamp(80px,10vw,140px)]")}>
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ul
            className={cn(
              "grid list-none grid-cols-1 gap-[clamp(20px,2.2vw,32px)]",
              "sm:grid-cols-2 xl:grid-cols-3",
            )}
          >
            {projects.map((project, position) => (
              <li key={project.projectUrl} className="flex">
                <ProjectGridCard
                  project={project}
                  // Staggers the first row only; further down the page the
                  // tiles are already arriving one scroll at a time.
                  delay={position < 3 ? position * 0.08 : 0}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

"use client";

/**
 * Phase 4 — Projects (client layout + motion).
 *
 * Each project is a case-study preview that needs the whole measure, so the
 * cards are never gridded. How they are presented depends on the room:
 *
 *   ≥ lg   a `<Stack />` — the cards sit in one pile, fanned by a couple of
 *          degrees, and the reader drags the top one away (or picks a dot) to
 *          get to the next. Four projects then cost one screen instead of
 *          four, and the pile itself says "there is more here".
 *   < lg   the plain vertical run. The stack needs every card to fill one
 *          fixed frame, and the stacked mobile card (screenshot, features and
 *          tech panel below one another) has no fixed height to give it.
 *
 * Only one of the two is ever mounted, so the links inside the cards exist
 * exactly once for assistive tech.
 *
 * The section header follows the About section's conventions — numbered
 * eyebrow, rolling display heading, short standfirst — so the two read as
 * chapters of the same document.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RollingText } from "@/components/motion/rolling-text";
import { Reveal } from "@/components/motion/scroll-reveal";
import { Stack } from "@/components/motion/stack";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import { ProjectShowcaseCard } from "@/features/projects/project-showcase-card";
import type { ShowcaseProject } from "@/features/projects/types";

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/**
 * The frame every stacked card fills: the card's own desktop height (80vh)
 * plus the indicator row beneath it, so the top card is exactly the size it
 * would be in the vertical run — see the sizing note in
 * `project-showcase-card.tsx`, which the card's `vh`-based internals assume.
 */
const STACK_HEIGHT = "h-[calc(80vh+54px)]";

/** Below this the cards go back to a plain vertical run (see the header). */
const STACK_QUERY = "(min-width: 1024px)";

function useMediaQuery(query: string): boolean {
  // False on the server and for the first client render, so the vertical run
  // is what hydrates and the stack is a post-mount upgrade.
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);

    sync();
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

export function ProjectsSectionContent({
  projects,
  eyebrow = "Projects",
  index = "04",
  heading = "Selected Work",
  standfirst = "A few builds worth walking through — what they do, what they are made of, and what I owned in each.",
  showAllHref,
}: {
  projects: ShowcaseProject[];
  eyebrow?: string;
  index?: string;
  heading?: string;
  standfirst?: string;
  /** Renders the "All projects" link when the full grid route exists. */
  showAllHref?: string;
}) {
  const isDesktop = useMediaQuery(STACK_QUERY);

  // A stack of one is just a card with extra machinery in front of it.
  const useStack = isDesktop && projects.length > 1;

  const stackCards = React.useMemo(
    () =>
      projects.map((project) => (
        <ProjectShowcaseCard key={project.projectUrl} project={project} fill />
      )),
    [projects],
  );

  // Nothing published yet — render nothing rather than an empty chapter.
  if (projects.length === 0) return null;

  return (
    <section id="projects" className="relative py-[clamp(80px,10vw,150px)]">
      {/* Scroll effect 03 — the card stage tips flat as it arrives. */}
      <SectionScrollFx effect="depth-stage" refreshKey={useStack ? "stack" : "run"} />

      <div className={CONTAINER}>
        <Reveal amount={0.6} distance={16}>
          <p className="flex items-center gap-4">
            <span className="font-display text-[13px] leading-none text-primary">
              {index}
            </span>
            <span className="h-px w-10 bg-primary/60" />
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {eyebrow}
            </span>
          </p>
        </Reveal>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <RollingText
            as="h2"
            text={heading}
            className={cn(
              "font-display uppercase text-foreground",
              "text-[clamp(2.6rem,6vw,4.2rem)] leading-[0.98] tracking-[0.008em]",
            )}
          />

          <Reveal delay={0.1} distance={14}>
            <p className="max-w-[46ch] font-sans text-[clamp(0.98rem,1.2vw,1.08rem)] leading-[1.7] text-foreground-muted">
              {standfirst}
            </p>
          </Reveal>
        </div>
      </div>

      {useStack ? (
        <div className="mt-[clamp(48px,6vw,88px)]">
          <div
            data-fx="stage"
            className={cn("mx-auto w-[80vw] text-foreground", STACK_HEIGHT)}
          >
            <Stack
              cards={stackCards}
              // Tuned right down from the defaults, which are set for a 208px
              // thumbnail: at 1400px wide, 4° of fan and 60° of drag tilt read
              // as a glitch rather than a pile of cards.
              rotationStep={1.1}
              scaleStep={0.032}
              tilt={6}
              perspective={2200}
              // Cards fan from the bottom edge, so the titles stay level and
              // the pile shows itself along the bottom of the frame.
              transformOrigin="50% 100%"
              // A short flick, not a throw: at this size the card only has to
              // move a little before the intent is obvious, and `dragElastic`
              // keeps the card itself from sliding half the viewport to say so.
              sensitivity={70}
              dragElastic={0.35}
              // The card owns its radius and its drop shadow; clipping here
              // would cut the shadow that separates one card from the next.
              clip={false}
              // Never on click: the top card carries two links of its own.
              sendToBackOnClick={false}
              // Snappier and better damped than the default, so the swap is a
              // short settle rather than a long swing.
              animationConfig={{ stiffness: 300, damping: 34 }}
              indicators
              indicatorLabel={(position) =>
                `Show ${projects[position]?.title ?? `project ${position + 1}`}`
              }
            />
          </div>

          <p className={cn(CONTAINER, "mt-5 text-center")}>
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              Drag a card aside for the next project
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-[clamp(48px,6vw,88px)] flex flex-col gap-[clamp(40px,5vw,80px)]">
          {projects.map((project, position) => (
            <ProjectShowcaseCard
              key={project.projectUrl}
              project={project}
              // Only the first card in view needs a lead-in; a long stack
              // shouldn't accumulate delay.
              delay={position === 0 ? 0.05 : 0}
            />
          ))}
        </div>
      )}

      {showAllHref && (
        <div className={cn(CONTAINER, "mt-14")}>
          <Reveal amount={0.6} distance={14}>
            <Link
              href={showAllHref}
              className={cn(
                "group inline-flex items-center gap-2.5 font-sans text-[15px] font-semibold text-foreground",
                "transition-colors duration-300 hover:text-primary-foreground ring-brand",
              )}
            >
              All projects
              <ArrowUpRight
                aria-hidden
                className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                strokeWidth={2.2}
              />
            </Link>
          </Reveal>
        </div>
      )}
    </section>
  );
}

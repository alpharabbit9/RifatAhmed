"use client";

/**
 * Phase 5 — Career Journey (client layout + motion).
 *
 * A single-rail timeline rather than the alternating left/right kind: entries
 * carry a logo, a paragraph, bullets and a pill row, and alternating sides
 * would either halve the measure or collapse to one column on the first
 * breakpoint anyway. On desktop the period sits in its own left column so the
 * dates read as a continuous scale down the page; below `lg` it folds into the
 * card above the role.
 *
 * The rail is drawn per entry — each segment runs from its own node to the
 * next one — so the line is continuous without a separate absolutely
 * positioned element measuring the whole list. Segments draw themselves in on
 * scroll (`scaleY`, origin top), which reads as the timeline extending as you
 * descend; under `prefers-reduced-motion` they are simply present.
 *
 * The section id is `experience`, not `career`: the navbar's "Experience" link
 * (components/ui/notch-navbar.tsx) already points at that anchor.
 */

import * as React from "react";
import Image from "next/image";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { TechPill } from "@/components/ui";
import { RollingText } from "@/components/motion/rolling-text";
import {
  ParallaxLayer,
  ParallaxScene,
  ParallaxWatermark,
} from "@/components/motion/scroll-parallax";
import { Reveal, ScrollRule } from "@/components/motion/scroll-reveal";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import type { CareerEntry, CareerSection } from "@/features/career/data";
import {
  formatDuration,
  formatPeriod,
  isVectorLogo,
} from "@/features/career/constants";

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/* -------------------------------------------------------------------------- */
/* Company logo                                                               */
/* -------------------------------------------------------------------------- */

function CompanyLogo({ entry }: { entry: CareerEntry }) {
  const tile =
    "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[13px] border border-border-light bg-background sm:h-12 sm:w-12";

  if (!entry.logo_url) {
    return (
      <span className={cn(tile, "text-foreground-subtle")} aria-hidden>
        <Building2 className="h-5 w-5" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <span className={tile}>
      <Image
        src={entry.logo_url}
        alt={`${entry.company} logo`}
        fill
        sizes="48px"
        // SVG can't go through the image optimizer without `dangerouslyAllowSVG`
        // (see constants.ts) — and company logos are routinely SVG.
        unoptimized={isVectorLogo(entry.logo_url)}
        className="object-contain"
      />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* One entry                                                                  */
/* -------------------------------------------------------------------------- */

function Separator() {
  return (
    <span aria-hidden className="h-1 w-1 rounded-full bg-foreground-subtle/50" />
  );
}

function TimelineEntry({
  entry,
  isLast,
}: {
  entry: CareerEntry;
  isLast: boolean;
}) {
  const period = formatPeriod(entry.start_date, entry.end_date);
  const duration = formatDuration(entry.start_date, entry.end_date);
  const isCurrent = Boolean(entry.start_date) && !entry.end_date;

  return (
    <li
      className={cn(
        "grid grid-cols-[22px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[26px_minmax(0,1fr)] sm:gap-x-5",
        "lg:grid-cols-[minmax(0,190px)_26px_minmax(0,1fr)] lg:gap-x-8",
      )}
    >
      {/* ---------------- Period (desktop column) ---------------- */}
      <div
        data-fx="date"
        className="hidden lg:flex lg:flex-col lg:items-end lg:pt-3.5 lg:text-right"
      >
        {period && (
          <span className="font-display text-[13.5px] uppercase leading-none tracking-[0.02em] text-foreground">
            {period}
          </span>
        )}
        {duration && (
          <span className="mt-1.5 font-sans text-[12px] text-foreground-subtle">
            {duration}
          </span>
        )}
        {entry.location && (
          <span className="mt-2 inline-flex items-center gap-1.5 font-sans text-[12px] text-foreground-subtle">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
            {entry.location}
          </span>
        )}
      </div>

      {/* ---------------- Rail ---------------- */}
      <div aria-hidden className="relative flex justify-center">
        {/* The node, level with the logo tile's centre. */}
        <span
          className={cn(
            "absolute top-[32px] h-[11px] w-[11px] rounded-full border-2 bg-background sm:top-[38px]",
            isCurrent
              ? "border-primary shadow-[0_0_0_5px_rgba(91,15,24,0.25)]"
              : "border-foreground/30",
          )}
        />

        {/* The segment down to the next node — faded out on the last one so
            the line ends rather than stopping dead.

            Drawn by GSAP rather than Framer (see `SectionScrollFx` below):
            `scaleY` is tied to scroll *position*, so the rail extends and
            retracts under the reader's hand instead of firing once. Under
            `prefers-reduced-motion` GSAP never runs and the line is simply
            present, which is why there is no `scaleY: 0` in the markup. */}
        <span
          data-fx="rail"
          className={cn(
            "absolute bottom-0 top-[48px] w-px origin-top sm:top-[54px]",
            isLast
              ? "bg-gradient-to-b from-border to-transparent"
              : "bg-border",
          )}
        />
      </div>

      {/* ---------------- Card ---------------- */}
      <Reveal amount={0.12} distance={22} className="pb-7 lg:pb-9">
        <article
          className={cn(
            "group relative overflow-hidden rounded-[16px] border border-border bg-surface p-4 sm:p-5",
            "transition-colors duration-500 hover:border-primary/45",
          )}
        >
          {/* Burgundy wash that fades up on hover — one accent, per §4. */}
          <span
            aria-hidden
            className="glow-radial pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-40"
          />

          <header className="relative flex items-start gap-3.5 sm:gap-4">
            <CompanyLogo entry={entry} />

            <div className="min-w-0 flex-1">
              {/* Below lg the period lives here instead of its own column. */}
              {period && (
                <p className="label-overline lg:hidden">{period}</p>
              )}

              <h3 className="mt-1 font-display text-[clamp(1.08rem,1.7vw,1.4rem)] uppercase leading-[1.05] tracking-[0.008em] text-foreground lg:mt-0">
                {entry.role}
              </h3>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[13.5px] text-foreground-muted">
                {entry.company_url ? (
                  <a
                    href={entry.company_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary ring-brand"
                  >
                    {entry.company}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    {entry.company}
                  </span>
                )}

                {entry.employment_type && (
                  <>
                    <Separator />
                    <span>{entry.employment_type}</span>
                  </>
                )}
              </p>

              {/* Duration + location fold in under the company below lg. */}
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[12px] text-foreground-subtle lg:hidden">
                {duration && <span>{duration}</span>}
                {duration && entry.location && <Separator />}
                {entry.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                    {entry.location}
                  </span>
                )}
              </p>
            </div>

            {isCurrent && (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 font-sans text-[0.63rem] font-semibold uppercase tracking-[0.14em] text-foreground sm:inline-flex">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Present
              </span>
            )}
          </header>

          {entry.description && (
            <p className="relative mt-4 max-w-[68ch] font-sans text-[13.5px] leading-[1.7] text-foreground-muted">
              {entry.description}
            </p>
          )}

          {entry.highlights.length > 0 && (
            <ul className="relative mt-4 flex flex-col gap-2">
              {entry.highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex gap-2.5 font-sans text-[13px] leading-[1.6] text-foreground-subtle"
                >
                  <span
                    aria-hidden
                    className="mt-[8px] h-px w-3 shrink-0 bg-primary/70"
                  />
                  <span className="max-w-[66ch]">{highlight}</span>
                </li>
              ))}
            </ul>
          )}

          {entry.skills.length > 0 && (
            <div className="relative mt-4 flex flex-wrap gap-1.5">
              {entry.skills.map((skill) => (
                <TechPill key={skill} className="text-[12px]">
                  {skill}
                </TechPill>
              ))}
            </div>
          )}

          {/* Hairline that draws across the card's foot on hover. */}
          <div aria-hidden className="relative mt-5">
            <span className="block h-px w-full origin-left scale-x-0 bg-primary/60 transition-transform duration-700 group-hover:scale-x-100" />
          </div>
        </article>
      </Reveal>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export interface CareerContentProps {
  section: CareerSection;
  entries: CareerEntry[];
  /** Numbered eyebrow — Projects is "04", so the timeline is "05". */
  index?: string;
}

export function CareerSectionContent({
  section,
  entries,
  index = "05",
}: CareerContentProps) {
  // Nothing to show — render nothing rather than an empty chapter. An empty
  // table means the admin cleared it on purpose (see data.ts).
  if (entries.length === 0) return null;

  return (
    <ParallaxScene
      as="section"
      id="experience"
      className="relative isolate overflow-hidden bg-background py-24 sm:py-28 lg:py-36"
    >
      {/* Scroll effect 04 — the rail draws itself as the reader descends. */}
      <SectionScrollFx effect="timeline-draw" refreshKey={entries.length} />

      {/* Atmosphere — one burgundy glow and the film grain from §14. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -right-[12%] top-[10%] h-[520px] w-[520px] rounded-full bg-primary/[0.09] blur-[180px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-overlay" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[6%] z-0 hidden lg:block"
      >
        <ParallaxWatermark
          drift={-110}
          className="text-right text-[16vw] tracking-[-0.005em] text-foreground/[0.03]"
        >
          EXPERIENCE
        </ParallaxWatermark>
      </div>

      <div className={cn(CONTAINER, "relative z-10")}>
        <Reveal amount={0.6} distance={16}>
          <p className="flex items-center gap-4">
            <span className="font-display text-[13px] leading-none text-primary">
              {index}
            </span>
            <span className="h-px w-10 bg-primary/60" />
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {section.eyebrow}
            </span>
          </p>
        </Reveal>

        <div className="mt-8 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <RollingText
              as="h2"
              text={section.heading}
              amount={0.4}
              className={cn(
                "font-display uppercase text-foreground",
                "text-[clamp(2.4rem,5.2vw,3.9rem)] leading-[0.98] tracking-[0.008em]",
              )}
            />
          </div>

          {section.standfirst && (
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <p className="max-w-[46ch] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.7] text-foreground-subtle">
                  {section.standfirst}
                </p>
              </Reveal>
            </div>
          )}
        </div>

        <ScrollRule className="mt-10" />

        <ParallaxLayer depth={-18}>
          {/* Capped: the card measure stays editorial instead of stretching
              the description across the full 1440 container. */}
          <ol className="mt-10 lg:mt-14 lg:max-w-[980px]">
            {entries.map((entry, entryIndex) => (
              <TimelineEntry
                key={entry.id}
                entry={entry}
                isLast={entryIndex === entries.length - 1}
              />
            ))}
          </ol>
        </ParallaxLayer>
      </div>
    </ParallaxScene>
  );
}

"use client";

/**
 * Phase 2 — About Me (client layout + motion).
 *
 * Everything the brief covers lives in ONE `#about` section rather than two
 * thinner ones: the story, the education card, then the categorised tech
 * stack. The stack reads as the second half of the same argument — "here is
 * how I think" followed by "here is what I build with" — which is why they
 * share a background, a watermark and a single parallax scene.
 *
 * Motion:
 *   · section headers roll in per character (components/motion/rolling-text)
 *   · the watermark, story column and stack grid sit at three parallax depths
 *     (components/motion/scroll-parallax)
 *   · everything else is a scroll-triggered reveal, and every layer collapses
 *     under `prefers-reduced-motion`.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { RollingLines, RollingText } from "@/components/motion/rolling-text";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import {
  ParallaxLayer,
  ParallaxScene,
  ParallaxWatermark,
} from "@/components/motion/scroll-parallax";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollMarquee,
  ScrollRule,
} from "@/components/motion/scroll-reveal";
import type {
  AboutContent,
  EducationEntry,
  SkillGroup,
} from "@/features/about/data";
import { getSkillIcon } from "@/features/about/icons";
import { TechPill } from "@/features/about/tech-pill";
import {
  RichText,
  splitLines,
  splitParagraphs,
} from "@/features/about/rich-text";

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/* -------------------------------------------------------------------------- */
/* Section eyebrow — "01 — About Me"                                          */
/* -------------------------------------------------------------------------- */

function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <Reveal amount={0.6} distance={16}>
      <p className="flex items-center gap-4">
        <span className="font-display text-[13px] leading-none text-primary">
          {index}
        </span>
        <span className="h-px w-10 bg-primary/60" />
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
          {label}
        </span>
      </p>
    </Reveal>
  );
}

/* -------------------------------------------------------------------------- */
/* Story                                                                      */
/* -------------------------------------------------------------------------- */

function Story({ about }: { about: AboutContent }) {
  const headingLines = splitLines(about.heading);
  const paragraphs = splitParagraphs(about.body);

  return (
    <div className="grid gap-x-6 gap-y-14 lg:grid-cols-12">
      {/* Display heading — rolls in line by line, drifts slowest. */}
      <div className="lg:col-span-5">
        <ParallaxLayer depth={38}>
          <RollingLines
            lines={headingLines}
            accentLast
            lineClassName={cn(
              "font-display uppercase text-foreground",
              "text-[clamp(3rem,7.5vw,4.5rem)] leading-[0.98] tracking-[0.008em]",
            )}
          />
          <Reveal delay={0.15} distance={14}>
            <span className="mt-8 block h-px w-16 bg-primary" />
          </Reveal>
        </ParallaxLayer>
      </div>

      {/* Body copy + education */}
      <div className="lg:col-span-7 lg:pt-2">
        <ParallaxLayer depth={-16}>
          <RevealGroup stagger={0.12} className="space-y-7">
            {paragraphs.map((paragraph, index) => (
              <RevealItem key={index}>
                <p
                  className={cn(
                    "max-w-[62ch] font-sans leading-[1.75] text-foreground-muted",
                    index === 0
                      ? "text-[clamp(1.05rem,1.5vw,1.28rem)]"
                      : "text-[clamp(0.98rem,1.2vw,1.08rem)]",
                  )}
                >
                  <RichText text={paragraph} />
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </ParallaxLayer>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Education                                                                  */
/* -------------------------------------------------------------------------- */

function Education({ entries }: { entries: EducationEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-16 lg:mt-20">
      <RevealGroup stagger={0.1} className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <RevealItem key={entry.id}>
            <article
              className={cn(
                "group relative h-full overflow-hidden rounded-[20px] border border-border bg-surface p-6 sm:p-7",
                "transition-colors duration-500 hover:border-primary/45",
              )}
            >
              {/* Burgundy wash that fades up on hover — one accent, per §4. */}
              <span
                aria-hidden
                className="glow-radial pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-40"
              />

              <div className="relative flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
                  <GraduationCap className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>

                <div className="min-w-0">
                  <p className="label-overline">Education</p>
                  <h3 className="mt-2 font-display text-[clamp(1.35rem,2vw,1.7rem)] uppercase leading-[1.05] text-foreground">
                    {entry.degree}
                  </h3>
                  <p className="mt-2 font-sans text-[15px] text-foreground-muted">
                    {entry.institution}
                  </p>

                  {entry.timeframe && (
                    <p className="mt-1 font-sans text-[13px] text-foreground-subtle">
                      {entry.timeframe}
                    </p>
                  )}
                  {entry.note && (
                    <p className="mt-3 font-sans text-[14px] leading-[1.65] text-foreground-subtle">
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill marquee — the band that separates story from stack                   */
/* -------------------------------------------------------------------------- */

function SkillMarquee({ labels }: { labels: string[] }) {
  const reduce = useReducedMotion() ?? false;

  if (labels.length === 0) return null;

  // Two passes so the row still spans the viewport once it drifts.
  const run = [...labels, ...labels];

  return (
    <div
      aria-hidden
      className="relative mt-20 border-y border-border-light py-6 lg:mt-24"
    >
      <ScrollMarquee distance={reduce ? 0 : -18}>
        {run.map((label, index) => (
          <span key={`${label}-${index}`} className="flex items-center">
            <span
              className={cn(
                "font-display text-[clamp(1.6rem,3vw,2.6rem)] uppercase leading-[1.02] tracking-[0.012em]",
                index % 3 === 1 ? "text-foreground/25" : "text-foreground/10",
              )}
            >
              {label}
            </span>
            <span className="mx-6 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 sm:mx-9" />
          </span>
        ))}
      </ScrollMarquee>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill group card                                                           */
/* -------------------------------------------------------------------------- */

function SkillGroupCard({ group, index }: { group: SkillGroup; index: number }) {
  const Icon = getSkillIcon(group.icon_name);
  const ordinal = String(index + 1).padStart(2, "0");

  return (
    <RevealItem className="h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-[20px]",
          "border border-border bg-surface p-7 sm:p-8",
          "transition-colors duration-500 hover:border-primary/50",
        )}
      >
        <span
          aria-hidden
          className="glow-radial pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-55"
        />

        <div className="relative flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-light text-foreground-muted transition-colors duration-500 group-hover:border-primary/50 group-hover:text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="font-display text-[2.2rem] leading-none text-foreground/12 transition-colors duration-500 group-hover:text-primary/70">
            {ordinal}
          </span>
        </div>

        <h3 className="relative mt-7 font-display text-[clamp(1.5rem,2.1vw,1.95rem)] uppercase leading-[1.06] tracking-[0.012em] text-foreground">
          {group.title}
        </h3>

        {group.summary && (
          <p className="relative mt-3.5 font-sans text-[14.5px] leading-[1.65] text-foreground-subtle">
            {group.summary}
          </p>
        )}

        <div className="relative mt-7 flex flex-wrap gap-2 pt-1">
          {group.skills.map((skill, skillIndex) => (
            <TechPill
              key={skill.id}
              label={skill.label}
              // Per-pill delay makes the row light up as a cascade on hover —
              // CSS transitions only, so it costs nothing at rest.
              delayMs={Math.min(skillIndex, 9) * 28}
            />
          ))}
        </div>

        {/* Hairline that draws across the card's foot on hover. */}
        <div aria-hidden className="relative mt-auto pt-7">
          <span className="block h-px w-full origin-left scale-x-0 bg-primary/60 transition-transform duration-700 group-hover:scale-x-100" />
        </div>
      </motion.article>
    </RevealItem>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export interface AboutContentProps {
  about: AboutContent;
  education: EducationEntry[];
  groups: SkillGroup[];
}

export function AboutSectionContent({
  about,
  education,
  groups,
}: AboutContentProps) {
  const marqueeLabels = React.useMemo(
    () => groups.flatMap((group) => group.skills.map((skill) => skill.label)),
    [groups],
  );

  return (
    <ParallaxScene
      as="section"
      id="about"
      className="relative isolate overflow-hidden bg-background py-24 sm:py-28 lg:py-36"
    >
      {/* Scroll effect 02 — the stack leans with the scroll and settles. */}
      <SectionScrollFx effect="velocity-skew" refreshKey={groups.length} />

      {/* Atmosphere — two burgundy glows and the film grain from §14. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-[12%] top-[12%] h-[560px] w-[560px] rounded-full bg-primary/[0.10] blur-[180px]" />
        <div className="absolute -right-[10%] bottom-[4%] h-[440px] w-[440px] rounded-full bg-primary/[0.07] blur-[160px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-overlay" />
      </div>

      {/* Oversized watermark, drifting against the scroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[4%] z-0 hidden lg:block"
      >
        <ParallaxWatermark
          drift={120}
          className="text-[17vw] tracking-[-0.005em] text-foreground/[0.03]"
        >
          ABOUT ME
        </ParallaxWatermark>
      </div>

      <div className={cn(CONTAINER, "relative z-10")}>
        {/* ---------------- Part one — the story ---------------- */}
        <Eyebrow index="01" label={about.eyebrow} />

        <div className="mt-10 lg:mt-14">
          <Story about={about} />
        </div>

        <Education entries={education} />

        {/* ---------------- The band between ---------------- */}
        <SkillMarquee labels={marqueeLabels} />

        {/* ---------------- Part two — the stack ---------------- */}
        {groups.length > 0 && (
          <div className="mt-20 lg:mt-28">
            <Eyebrow index="02" label={about.stack_eyebrow} />

            <div className="mt-8 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <RollingText
                  as="h2"
                  text={about.stack_heading}
                  amount={0.4}
                  className={cn(
                    "font-display uppercase text-foreground",
                    "text-[clamp(2.4rem,5.2vw,3.9rem)] leading-[0.98] tracking-[0.008em]",
                  )}
                />
              </div>

              {about.stack_body && (
                <div className="lg:col-span-5">
                  <Reveal delay={0.1}>
                    <p className="max-w-[46ch] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.7] text-foreground-subtle">
                      {about.stack_body}
                    </p>
                  </Reveal>
                </div>
              )}
            </div>

            <ScrollRule className="mt-10" />

            {/* `data-fx="skew"` is this wrapper, not the cards: Framer owns
                the cards' entrance transform, GSAP owns the lean, and the two
                compose because they write to different elements. */}
            <div data-fx="skew">
              <ParallaxLayer depth={-22}>
                <RevealGroup
                  stagger={0.12}
                  amount={0.15}
                  className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                >
                  {groups.map((group, index) => (
                    <SkillGroupCard
                      key={group.id}
                      group={group}
                      index={index}
                    />
                  ))}
                </RevealGroup>
              </ParallaxLayer>
            </div>
          </div>
        )}
      </div>
    </ParallaxScene>
  );
}

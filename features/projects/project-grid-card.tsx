"use client";

/**
 * The card the `/projects` index renders — one project per tile.
 *
 * Deliberately *not* `<ProjectShowcaseCard>`: that card is a case-study
 * preview sized to 80% of the viewport, and a page of them would be a page of
 * full-screen compositions. This is the list-item form of the same project —
 * screenshot, category, title, standfirst, tech — sized so three sit side by
 * side and a visitor can scan twenty of them.
 *
 * Every tile is one link to `/projects/<slug>`, so the whole card is the hit
 * target (the arrow is decoration, not a second link). It renders from the
 * same `ShowcaseProject` the home-page card takes, so the index needs no
 * second read and no second shape.
 *
 * The screenshot sits in a fixed 16:10 frame and is `object-contain`, matching
 * the case-study gallery: uniform tile heights across the grid, and the shot
 * itself is never cropped or stretched (§15) — the letterbox is the frame's
 * own near-black, so a 16:9 screenshot reads as flush.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";
import type { ShowcaseProject } from "@/features/projects/types";

/** Burgundy pulled toward cream — see `detail/tokens.ts` for the reasoning. */
const ACCENT_TINT = "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

/** Beyond this the chip row wraps to a third line and the tiles go ragged. */
const MAX_TECH_CHIPS = 5;

function Thumbnail({
  src,
  alt,
  featured,
}: {
  src: string | null;
  alt: string;
  featured?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0B0A0A]">
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          // One column below sm, two to xl, three above — inside a 1440px
          // container with 60px gutters.
          sizes="(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 30vw"
          className={cn(
            "object-contain object-center",
            "transition-transform duration-700 ease-out group-hover:scale-[1.03]",
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2.5"
          style={{
            backgroundImage:
              "radial-gradient(90% 90% at 70% 10%, color-mix(in srgb, var(--primary) 32%, transparent) 0%, transparent 70%)",
          }}
        >
          <ImageOff
            aria-hidden
            className="h-6 w-6"
            strokeWidth={1.4}
            style={{ color: ACCENT_TINT }}
          />
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(248,241,231,0.45)]">
            Screenshot coming soon
          </p>
        </div>
      )}

      {/* Says why this one also appears on the home page. */}
      {featured && (
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full",
            "bg-primary/90 px-2.5 py-1 backdrop-blur-sm",
            "font-sans text-[9.5px] font-semibold uppercase tracking-[0.16em] text-primary-foreground",
          )}
        >
          <span
            aria-hidden
            className="h-[5px] w-[5px] rounded-full bg-primary-foreground"
          />
          Featured
        </span>
      )}
    </div>
  );
}

export interface ProjectGridCardProps {
  project: ShowcaseProject;
  /** Staggers a row of tiles; passed straight to the entrance transition. */
  delay?: number;
  className?: string;
}

export function ProjectGridCard({
  project,
  delay = 0,
  className,
}: ProjectGridCardProps) {
  const reduce = useReducedMotion() ?? false;

  const chips = project.technologies.slice(0, MAX_TECH_CHIPS);
  const overflow = project.technologies.length - chips.length;

  // The meta line only renders the halves that exist — a project with no year
  // shouldn't leave a dangling separator.
  const meta = [project.year, project.role].filter(Boolean);

  return (
    <motion.article
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: EASE_EDITORIAL, delay }}
      className={cn("h-full", className)}
    >
      <Link
        href={project.projectUrl}
        className={cn(
          "group ring-brand flex h-full flex-col overflow-hidden rounded-[20px]",
          "border border-[rgba(248,241,231,0.14)] bg-surface",
          "shadow-[0_28px_70px_-52px_rgba(0,0,0,0.95)]",
          "transition-[colors,transform] duration-500",
          "hover:border-[rgba(248,241,231,0.34)]",
          reduce ? "" : "hover:-translate-y-1",
        )}
      >
        <Thumbnail
          src={project.screenshot}
          alt={project.screenshotAlt ?? project.title}
          featured={project.featured}
        />

        <div className="flex min-w-0 flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className={cn(
                "inline-flex h-7 items-center gap-2 rounded-[8px] bg-primary px-3",
                "font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground",
              )}
            >
              {project.category}
            </span>
            {meta.length > 0 && (
              <span className="font-sans text-[11.5px] uppercase tracking-[0.12em] text-foreground-subtle">
                {meta.join(" · ")}
              </span>
            )}
          </div>

          <h2
            className={cn(
              "mt-4 font-display uppercase leading-[0.95] tracking-[0.008em] text-foreground",
              "text-[clamp(1.6rem,2.2vw,2.1rem)]",
            )}
          >
            {project.title}
          </h2>

          {project.subtitle && (
            <p
              className="mt-2 font-sans text-[12.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: ACCENT_TINT }}
            >
              {project.subtitle}
            </p>
          )}

          {project.description && (
            // Three lines: tiles in a row share a height, and a long entry
            // would otherwise stretch every card beside it.
            <p className="mt-3.5 line-clamp-3 font-sans text-[14px] leading-[1.6] text-[rgba(248,241,231,0.66)]">
              {project.description}
            </p>
          )}

          {/* Pushed to the bottom so the footer rule lines up across the row
              however short the copy above it is. */}
          <div className="mt-auto pt-6">
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {chips.map((label) => (
                  <li
                    key={label}
                    className={cn(
                      "rounded-full border border-[rgba(248,241,231,0.16)] px-2.5 py-1",
                      "font-sans text-[10.5px] font-medium tracking-[0.04em] text-[rgba(248,241,231,0.62)]",
                    )}
                  >
                    {label}
                  </li>
                ))}
                {overflow > 0 && (
                  <li className="rounded-full px-1.5 py-1 font-sans text-[10.5px] font-medium text-foreground-subtle">
                    +{overflow}
                  </li>
                )}
              </ul>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-[rgba(248,241,231,0.10)] pt-4">
              <span className="font-sans text-[13px] font-semibold text-foreground">
                View case study
              </span>
              <ArrowUpRight
                aria-hidden
                className={cn(
                  "h-[18px] w-[18px] text-foreground-subtle transition-all duration-300",
                  "group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-foreground",
                )}
                strokeWidth={2}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

"use client";

/**
 * Phase 4 — ProjectShowcaseCard.
 *
 * One large editorial panel per project: display title and story on the left,
 * the product screenshot floating over a burgundy sweep on the right, the two
 * CTAs bottom-left and the tech stack in a burgundy block overlapping the
 * bottom-right corner. It is a *case study preview*, not a list item — see
 * UI-Section-Examples/Project_card_Example.png and Design_System.md §20.
 *
 * On desktop the card is 80% of the viewport — `80vw × 80vh`, centred, with a
 * tenth of the screen clear on every side — so a project is taken in as a
 * single composition rather than scrolled through, and the page around it is
 * still visible.
 *
 * **Everything inside is sized in `vh`, not pixels.** The card is a fixed
 * fraction of the viewport, so viewport units are a direct proxy for "a
 * fraction of the card": the title, the badge, the feature tiles, the buttons
 * and the tech panel all shrink and grow together, and the composition holds
 * from a 700px laptop to a 1440px display. Every value is a
 * `clamp(floor, Nvh, ceiling)` so it never collapses or runs away. The title
 * additionally caps on `vw`, because a tall narrow window would otherwise size
 * it past the width of its own column.
 *
 * The height being fixed makes the left column a fixed budget: the description
 * clamps to three lines, feature blurbs to two, and the grid shows at most
 * `MAX_CARD_FEATURES`. Loosen any of those and the features push down over the
 * footer.
 *
 * `fill` swaps the viewport sizing for `h-full`, which is what `<Stack />`
 * needs — see `projects-content.tsx`. The `vh`-based internals work unchanged
 * there because the stack's frame is itself sized in `vh`.
 *
 * Fully data-driven: every string, icon, image and link arrives through the
 * `project` prop (`ShowcaseProject` in ./types), so the same component renders
 * an AI agent, a RAG system or an automation build with no branching. It
 * survives a long title, two features or six, ten technologies, and a missing
 * live demo (the button disappears rather than rendering disabled).
 *
 * Composition:
 *   CategoryBadge · ProjectContent (Title/Subtitle/Description/FeatureGrid)
 *   ProjectVisual (BurgundyDecoration/DotGrid/Screenshot)
 *   ProjectFooter (ProjectActions) · TechPanel (the corner block)
 *
 * Motion is Framer Motion only (already a dependency) and stays restrained:
 * a single entrance reveal, a slightly delayed screenshot, a subtle feature
 * stagger, and hover shifts measured in single-digit pixels. Everything
 * collapses under `prefers-reduced-motion`.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";
import { FollowerPointerCard } from "@/components/motion/following-pointer";
import { getTechLogo } from "@/features/about/tech-logos";
import { getFeatureIcon } from "@/features/projects/icons";
import type { ShowcaseProject } from "@/features/projects/types";

/**
 * Burgundy lightened toward cream. Pure #5B0F18 on #0B0B0B is too close to
 * black for 20px type or 1.5px dots to survive, so accents that must *read*
 * (subtitle, feature icons, dot grid) use this mix of the two brand colours
 * while fills and surfaces stay true burgundy.
 */
const ACCENT_TINT = "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

/**
 * The tech panel's surface. It used to be Soft Cream, which turned the card's
 * bottom-right corner into the brightest thing on the page and pulled the eye
 * away from the screenshot — §17 wants a deep black base with burgundy shapes,
 * not a cream slab. Burgundy over the elevated surface reads as a distinct
 * block against the card's own `--background` without ever going light.
 */
const PANEL_SURFACE = "color-mix(in srgb, var(--primary) 26%, var(--surface))";

/**
 * The card is a fixed-height composition, so the feature row has a fixed
 * budget: one row, never two. At 80vw the left column is roughly 450px on a
 * 1280px screen, which is three tiles wide — a fourth would either wrap (and
 * push down over the footer) or squeeze the columns until every title broke
 * across two lines. The case-study page carries the full list.
 */
const MAX_CARD_FEATURES = 3;

/* -------------------------------------------------------------------------- */
/* Category badge                                                             */
/* -------------------------------------------------------------------------- */

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-11 items-center gap-2.5 rounded-[10px] bg-primary px-5 sm:h-12",
        "font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-primary-foreground",
        // Desktop: everything in the card is a fraction of the viewport.
        "lg:h-[clamp(36px,5.2vh,48px)] lg:gap-2 lg:px-[clamp(13px,2.1vh,20px)]",
        "lg:text-[clamp(9.5px,1.4vh,12px)]",
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary-foreground" />
      {category}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature grid                                                               */
/* -------------------------------------------------------------------------- */

const featureListVariants: Variants = {
  rest: {},
  reveal: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const featureItemVariants: Variants = {
  rest: { opacity: 0, y: 14 },
  reveal: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_EDITORIAL } },
};

function FeatureGrid({ features }: { features: ShowcaseProject["features"] }) {
  if (features.length === 0) return null;

  const shown = features.slice(0, MAX_CARD_FEATURES);

  return (
    <motion.ul
      variants={featureListVariants}
      // `auto-fit` rather than a fixed 3, so two features fill the row too.
      // The 104px floor is what three columns need inside the left band at the
      // narrowest desktop the 80vw card reaches; wider columns are shared out.
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-6",
        "sm:grid-cols-[repeat(auto-fit,minmax(104px,1fr))]",
        "lg:gap-x-[clamp(10px,1.4vw,20px)] lg:gap-y-[clamp(14px,2.2vh,24px)]",
      )}
    >
      {shown.map(({ icon, title, description }) => {
        // A string arrived from the database (icons can't cross the RSC
        // boundary as components); a component came from a literal.
        const Icon = typeof icon === "string" ? getFeatureIcon(icon) : icon;

        return (
          // `min-w-0` so a long word wraps inside its column instead of
          // widening the track and shunting the next feature out of line.
          <motion.li key={title} variants={featureItemVariants} className="min-w-0">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[12px]",
                "border border-[rgba(248,241,231,0.18)] bg-transparent",
                "transition-transform duration-500 ease-out group-hover:scale-[1.06]",
                "lg:h-[clamp(34px,5.2vh,48px)] lg:w-[clamp(34px,5.2vh,48px)]",
              )}
            >
              <Icon
                aria-hidden
                className="h-[22px] w-[22px] lg:h-[clamp(15px,2.4vh,22px)] lg:w-[clamp(15px,2.4vh,22px)]"
                strokeWidth={1.6}
                style={{ color: ACCENT_TINT }}
              />
            </span>
            <h4
              className={cn(
                "mt-3.5 font-sans text-[15.5px] font-semibold leading-[1.25] text-foreground",
                "lg:mt-[clamp(7px,1.4vh,14px)] lg:text-[clamp(12px,1.8vh,15.5px)]",
              )}
            >
              {title}
            </h4>
            {/* Two lines, always: the card's height is fixed, so a wordy
                feature has to wrap rather than grow the row into the footer. */}
            <p
              className={cn(
                "mt-1.5 line-clamp-2 font-sans text-[13.5px] leading-[1.45]",
                "text-[rgba(248,241,231,0.62)]",
                "lg:mt-[clamp(3px,0.7vh,6px)] lg:text-[clamp(10.5px,1.6vh,13.5px)]",
              )}
            >
              {description}
            </p>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Visual — burgundy sweep, dot grid, screenshot                              */
/* -------------------------------------------------------------------------- */

function BurgundyDecoration() {
  return (
    <>
      {/* Desktop: a half-ellipse anchored to the right edge — the curved
          burgundy shape the screenshot sits on in the reference. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 top-0 hidden h-full w-[62%] lg:block",
          "transition-transform duration-700 ease-out group-hover:translate-x-[10px]",
        )}
        style={{
          borderRadius: "52% 0 0 52% / 50% 0 0 50%",
          backgroundImage:
            "linear-gradient(115deg, color-mix(in srgb, var(--primary) 26%, transparent) 0%, color-mix(in srgb, var(--primary) 12%, transparent) 55%, transparent 100%)",
        }}
      />
      {/* Below lg the ellipse has nowhere to sit, so the same tone arrives as
          a corner wash instead of the card going flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          backgroundImage:
            "radial-gradient(90% 60% at 100% 0%, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 70%)",
        }}
      />
    </>
  );
}

function DotGrid() {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute hidden lg:block",
        "right-[clamp(12px,1.5vw,24px)] top-[clamp(12px,1.9vh,24px)]",
        "h-[clamp(120px,23vh,210px)] w-[clamp(170px,19vw,290px)]",
      )}
      style={{
        backgroundImage: `radial-gradient(circle, ${ACCENT_TINT} 1.3px, transparent 1.3px)`,
        backgroundSize: "17px 17px",
        opacity: 0.3,
        // Fades out toward the card's interior so the grid never reads as a
        // dashboard texture — just a corner of print-like tone.
        maskImage:
          "radial-gradient(120% 120% at 100% 0%, #000 10%, transparent 68%)",
        WebkitMaskImage:
          "radial-gradient(120% 120% at 100% 0%, #000 10%, transparent 68%)",
      }}
    />
  );
}

function Screenshot({
  src,
  alt,
  delay,
}: {
  src: string | null;
  alt: string;
  delay: number;
}) {
  const reduce = useReducedMotion() ?? false;
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_EDITORIAL, delay }}
      className={cn(
        // A fixed 16:10 frame at every width, never the full height of the
        // card's band: the band is close to square, so stretching the frame
        // to fill it is what used to crop a third off the sides of a 16:9
        // screenshot. `lg:max-h-full` is the safety rail for a short viewport
        // — if the band can't give the frame its full 16:10 height, the frame
        // widens instead and `object-contain` still shows the whole shot.
        "relative aspect-[16/10] w-full overflow-hidden rounded-[24px] bg-[#0B0A0A]",
        "lg:max-h-full",
        "border border-[rgba(248,241,231,0.25)]",
        "shadow-[0_34px_70px_-34px_rgba(0,0,0,0.95)]",
        "lg:rounded-[clamp(14px,2.2vh,22px)]",
        // Rests a few pixels proud of the card, lifts a little further on
        // hover — integrated, not floating.
        "transition-transform duration-500 ease-out",
        reduce ? "" : "-translate-y-1 group-hover:-translate-y-2.5",
      )}
    >
      {/* `object-contain`, the same rule the case-study gallery follows: a
          screenshot is never cropped and never stretched (§15), and the
          letterbox is the frame's own near-black, so a 16:9 shot reads as
          flush against a 16:10 frame. */}
      {showImage ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          // The right column is ~51% of an 80vw card.
          sizes="(max-width: 1024px) 92vw, 41vw"
          className="object-contain object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3"
          style={{
            backgroundImage:
              "radial-gradient(90% 90% at 70% 10%, color-mix(in srgb, var(--primary) 32%, transparent) 0%, transparent 70%)",
          }}
        >
          <ImageOff
            aria-hidden
            className="h-7 w-7 lg:h-[clamp(18px,2.8vh,28px)] lg:w-[clamp(18px,2.8vh,28px)]"
            strokeWidth={1.4}
            style={{ color: ACCENT_TINT }}
          />
          <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-[rgba(248,241,231,0.45)] lg:text-[clamp(9px,1.4vh,12px)]">
            Screenshot coming soon
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

const arrowVariants: Variants = {
  rest: { x: 0, y: 0 },
  hover: { x: 4, y: -3, transition: { duration: 0.35, ease: EASE_EDITORIAL } },
};

function ProjectActions({
  projectUrl,
  liveDemo,
  title,
}: {
  projectUrl: string;
  liveDemo?: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <motion.div initial="rest" whileHover="hover" whileFocus="hover" animate="rest">
        <Link
          href={projectUrl}
          aria-label={`View the ${title} project`}
          className={cn(
            "inline-flex h-14 w-[220px] items-center justify-center gap-2.5 rounded-[28px]",
            "bg-primary font-sans text-[15px] font-semibold text-primary-foreground",
            "transition-colors duration-300 hover:bg-primary-hover ring-brand",
            // Radius stays half the height so the pill never squares off.
            "lg:h-[clamp(42px,6.4vh,56px)] lg:w-[clamp(160px,16vw,220px)]",
            "lg:rounded-[clamp(21px,3.2vh,28px)] lg:text-[clamp(12px,1.75vh,15px)]",
          )}
        >
          View Project
          <motion.span variants={arrowVariants} className="inline-flex">
            <ArrowUpRight
              aria-hidden
              className="h-[18px] w-[18px] lg:h-[clamp(13px,2vh,18px)] lg:w-[clamp(13px,2vh,18px)]"
              strokeWidth={2.2}
            />
          </motion.span>
        </Link>
      </motion.div>

      {/* Rendered only when the project actually has a demo — never a
          disabled button (§15). */}
      {liveDemo && (
        <motion.div initial="rest" whileHover="hover" whileFocus="hover" animate="rest">
          <a
            href={liveDemo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open the live ${title} demo in a new tab`}
            className={cn(
              "inline-flex h-14 items-center justify-center gap-2.5 rounded-[28px] px-7",
              "border border-[rgba(248,241,231,0.55)] font-sans text-[15px] font-semibold text-foreground",
              "transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground ring-brand",
              "lg:h-[clamp(42px,6.4vh,56px)] lg:px-[clamp(16px,2.6vh,28px)]",
              "lg:rounded-[clamp(21px,3.2vh,28px)] lg:text-[clamp(12px,1.75vh,15px)]",
            )}
          >
            Live Demo
            <motion.span variants={arrowVariants} className="inline-flex">
              <ArrowUpRight
                aria-hidden
                className="h-[18px] w-[18px] lg:h-[clamp(13px,2vh,18px)] lg:w-[clamp(13px,2vh,18px)]"
                strokeWidth={2.2}
              />
            </motion.span>
          </a>
        </motion.div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Technology marks                                                           */
/* -------------------------------------------------------------------------- */

/** Two-letter fallback for labels with no brand mark ("RAG", "REST APIs"). */
function initialsOf(label: string): string {
  const words = label.trim().split(/[\s./-]+/).filter(Boolean);
  const raw =
    words.length > 1
      ? `${words[0][0]}${words[1][0]}`
      : label.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2);
  return raw.toUpperCase();
}

function TechnologyIcons({ technologies }: { technologies: string[] }) {
  if (technologies.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {technologies.map((label) => {
        const logo = getTechLogo(label);

        return (
          <li key={label} className="group/tech relative">
            <span
              // The name is the accessible label; the tooltip below is purely
              // visual, so the icon is never the only carrier of meaning.
              aria-label={label}
              role="img"
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-transparent",
                // Cream on the dark burgundy panel — dimmed at rest so a row
                // of ten reads as texture, full strength on hover.
                "border border-[rgba(248,241,231,0.20)] text-[rgba(248,241,231,0.66)]",
                "transition-colors duration-300",
                "group-hover/tech:border-[rgba(248,241,231,0.45)] group-hover/tech:text-foreground",
                "lg:h-[clamp(30px,4.6vh,42px)] lg:w-[clamp(30px,4.6vh,42px)]",
              )}
            >
              {logo ? (
                // Monochrome at rest so a row of ten never turns into
                // confetti; the brand colour only surfaces on hover.
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className={cn(
                    "h-[18px] w-[18px] fill-current transition-[fill] duration-300",
                    "group-hover/tech:fill-[var(--brand)]",
                    "lg:h-[clamp(12px,1.9vh,18px)] lg:w-[clamp(12px,1.9vh,18px)]",
                  )}
                  style={{ "--brand": logo.color } as React.CSSProperties}
                >
                  <path d={logo.path} />
                </svg>
              ) : (
                <span className="font-sans text-[12px] font-semibold tracking-[0.04em]">
                  {initialsOf(label)}
                </span>
              )}
            </span>

            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 whitespace-nowrap",
                "rounded-md border border-[rgba(248,241,231,0.18)] bg-surface-elevated px-2.5 py-1.5",
                "font-sans text-[11px] font-medium tracking-[0.04em] text-foreground",
                "opacity-0 transition-opacity duration-200 group-hover/tech:opacity-100",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Tech panel — the cream block on the card's bottom-right corner             */
/* -------------------------------------------------------------------------- */

/**
 * The panel carrying the tech stack. It overlaps the card's bottom-right
 * corner on desktop (asymmetric radii, so it reads as part of the frame
 * rather than a floating card) and drops into normal flow below lg.
 *
 * Burgundy over the elevated surface, not the reference's Soft Cream: at this
 * size a cream slab out-shouts the screenshot and breaks §17's deep-black
 * base. The hairline edge is what separates it from the card behind it now.
 */
function TechPanel({
  technologies,
  className,
}: {
  technologies: string[];
  className?: string;
}) {
  if (technologies.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col justify-center gap-3 px-8 py-6",
        "border-[rgba(248,241,231,0.14)]",
        "lg:gap-[clamp(5px,1.1vh,12px)] lg:px-[clamp(16px,2vw,32px)] lg:py-[clamp(10px,1.8vh,24px)]",
        className,
      )}
      style={{ backgroundColor: PANEL_SURFACE }}
    >
      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(248,241,231,0.55)] lg:text-[clamp(8px,1.2vh,10px)]">
        Tech Stack
      </p>
      <TechnologyIcons technologies={technologies} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

export interface ProjectShowcaseCardProps {
  project: ShowcaseProject;
  /** Staggers a stack of cards; passed straight to the entrance transition. */
  delay?: number;
  className?: string;
  /**
   * Fill the parent box instead of sizing to the viewport — how the card is
   * rendered inside `<Stack />`, where every card has to occupy the same
   * absolutely-positioned frame. Also drops the follower pointer, so the
   * stack's own grab cursor is what the reader sees.
   *
   * Desktop-only: the fill layout assumes the two-column band, so the section
   * keeps the flow layout below `lg`.
   */
  fill?: boolean;
}

export function ProjectShowcaseCard({
  project,
  delay = 0,
  className,
  fill = false,
}: ProjectShowcaseCardProps) {
  const reduce = useReducedMotion() ?? false;
  const titleId = React.useId();

  // Drives the desktop footer's right-hand gutter — with no tech panel to
  // clear, the buttons use the full width.
  const hasTechPanel = project.technologies.length > 0;

  const article = (
    <motion.article
      aria-labelledby={titleId}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, ease: EASE_EDITORIAL, delay }}
      className={cn(
        "group relative overflow-hidden rounded-[24px] bg-background",
        "shadow-[0_36px_90px_-50px_rgba(0,0,0,0.9)]",
        // The border brightens on hover — CSS, so it stays off the motion
        // thread and costs no re-render.
        "border border-[rgba(248,241,231,0.25)] transition-colors duration-500",
        "hover:border-[rgba(248,241,231,0.42)]",
        // Desktop: 80% of the viewport, centred — a tenth of the screen stays
        // clear on every side, so the card reads as one composition without
        // filling the window. Below lg it stacks and takes the height it
        // needs. Everything inside is sized in `vh` against this box.
        fill ? "flex h-full flex-col" : "lg:flex lg:h-[80vh] lg:flex-col",
      )}
    >
      <BurgundyDecoration />
      <DotGrid />

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-col p-[clamp(22px,2.6vw,44px)] lg:flex-1",
          "lg:p-[clamp(18px,3.2vh,38px)]",
        )}
      >
        {/* ── Main grid: story left, screenshot right ─────────────────── */}
        {/* Near-even split rather than the old 0.9/1.1: at 80vw the left band
            has to stay wide enough for three feature tiles in one row. */}
        <div
          className={cn(
            "grid min-h-0 items-center gap-10 lg:flex-1 lg:items-stretch",
            "lg:grid-cols-[1fr_1.05fr] lg:gap-[clamp(20px,2.8vw,48px)]",
          )}
        >
          <motion.div
            variants={featureListVariants}
            initial="rest"
            whileInView="reveal"
            viewport={{ once: true, amount: 0.25 }}
            className="flex min-w-0 flex-col justify-center"
          >
            <CategoryBadge category={project.category} />

            <h3
              id={titleId}
              className={cn(
                "mt-6 font-display uppercase leading-[0.9] tracking-[0.008em] text-foreground",
                "text-[clamp(3rem,14vw,5rem)]",
                // Height drives the size, but a tall narrow window would set
                // the title wider than its own column — hence the `vw` cap.
                "lg:mt-[clamp(12px,2.6vh,28px)] lg:text-[clamp(2rem,min(6vh,5.2vw),5rem)]",
              )}
            >
              {project.title}
            </h3>

            {project.subtitle && (
              <p
                className={cn(
                  "mt-3.5 font-sans text-[clamp(1rem,1.25vw,1.25rem)] font-semibold uppercase tracking-[0.08em]",
                  "lg:mt-[clamp(7px,1.5vh,14px)] lg:text-[clamp(0.8rem,1.95vh,1.15rem)]",
                )}
                style={{ color: ACCENT_TINT }}
              >
                {project.subtitle}
              </p>
            )}

            {project.description && (
              // Three lines is the ceiling the layout is designed around;
              // clamping keeps a long entry from pushing the feature row
              // down over the footer instead of silently breaking the
              // composition.
              <p
                className={cn(
                  "mt-5 max-w-[520px] font-sans text-[clamp(0.98rem,1.05vw,1.1rem)] leading-[1.6]",
                  "text-[rgba(248,241,231,0.72)] lg:line-clamp-3",
                  "lg:mt-[clamp(10px,2.1vh,20px)] lg:max-w-[46ch]",
                  "lg:text-[clamp(0.78rem,1.7vh,1.02rem)] lg:leading-[1.55]",
                )}
              >
                {project.description}
              </p>
            )}

            {/* Editorial divider */}
            <span
              aria-hidden
              className={cn(
                "my-6 block h-0.5 w-[60px]",
                "lg:my-[clamp(11px,2.3vh,24px)] lg:w-[clamp(36px,4.8vh,60px)]",
              )}
              style={{ backgroundColor: ACCENT_TINT }}
            />

            <FeatureGrid features={project.features} />
          </motion.div>

          {/* The frame is 16:10, the band is near-square — so centre it
              rather than letting it hang from the top of the column. */}
          <div className="flex min-h-0 min-w-0 items-center justify-center">
            <Screenshot
              src={project.screenshot}
              alt={project.screenshotAlt ?? project.title}
              delay={delay + 0.12}
            />
          </div>
        </div>

        {/* ── Footer: the two CTAs, bottom-left; the tech panel overlaps
              the corner beside them. ──────────────────────────────────── */}
        <div
          className={cn(
            "mt-10 flex flex-col gap-8 pt-7",
            "border-t border-[rgba(248,241,231,0.15)]",
            // On desktop the footer is exactly the card's bottom band —
            // flush with the edge (the negative margin eats the container's
            // bottom padding, so it has to match `lg:p-…` above), so its rule
            // lines up with the top of the panel beside it. `lg:h-…` here and
            // the panel's `lg:min-h-…` are one measurement: change both.
            "lg:mt-[clamp(10px,1.8vh,24px)] lg:pt-[clamp(11px,2vh,26px)]",
            "lg:h-[clamp(78px,12vh,116px)] lg:shrink-0",
            "lg:mb-[calc(clamp(18px,3.2vh,38px)*-1)]",
            "lg:flex-row lg:items-center",
            hasTechPanel && "lg:pr-[48%]",
          )}
        >
          <ProjectActions
            projectUrl={project.projectUrl}
            liveDemo={project.liveDemo}
            title={project.title}
          />
        </div>
      </div>

      {/* Tech stack — overlapping the bottom-right edge on desktop, normal
          flow below lg (§18/§21). */}
      <TechPanel
        technologies={project.technologies}
        className="relative z-10 rounded-b-[24px] border-t lg:hidden"
      />
      <TechPanel
        technologies={project.technologies}
        className={cn(
          "absolute bottom-0 right-0 z-20 hidden w-[46%] lg:flex",
          // Matches the footer band's `lg:h-…` exactly — see the note there.
          "lg:min-h-[clamp(78px,12vh,116px)]",
          "rounded-tl-[24px] rounded-br-[24px] border-l border-t",
        )}
      />
    </motion.article>
  );

  // Inside a stack the card is already under a grab cursor and a drag
  // handler; a second custom cursor on top of that just fights it.
  if (fill) {
    return <div className={cn("h-full w-full", className)}>{article}</div>;
  }

  return (
    <FollowerPointerCard
      title={project.title}
      // 80vw, centred, on desktop; below lg the card is a stacked block and
      // wants the width it can get.
      className={cn("mx-auto w-[min(92vw,1400px)] lg:w-[80vw]", className)}
    >
      {article}
    </FollowerPointerCard>
  );
}

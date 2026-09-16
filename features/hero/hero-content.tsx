"use client";

/**
 * Phase 1 — Hero presentation + motion.
 *
 * Data comes from `hero-section.tsx` (the Server Component shell); this file
 * owns layout, the Framer entrance stagger and the pointer parallax only.
 * Every string and image here is admin-editable at /admin/hero — the pieces
 * that stay hardcoded are the ones that are design, not content (the depth
 * extrusion constants, the mask geometry, the arc positions).
 *
 * Anything that can be blanked in the CMS hides its own block rather than
 * leaving a gap: no tagline, no quote words and no CV upload are all valid
 * states of a finished page.
 */

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ArrowUpRight, Download } from "lucide-react";
import { DepthText } from "@/components/motion/depth-text";
import { InfiniteRollText } from "@/components/motion/infinite-roll-text";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import { cn } from "@/lib/utils";
import type { HeroProfile } from "@/features/hero/data";
import { isVectorImage, nameLines } from "@/features/hero/constants";
import { socialIconFor } from "@/features/hero/icons";
import {
  ParallaxLayer,
  usePointerParallax,
  type PointerParallax,
} from "@/features/hero/parallax";

export type HeroSocial = {
  id: string;
  platform: string;
  url: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

/**
 * Maximum travel per depth plane, in pixels. The portrait is nearest so it
 * moves furthest; the brush artwork sits behind everything and barely shifts.
 * Keeping all three under ~30px is what stops the composition detaching from
 * the burgundy glow, which is painted on the section and does not move.
 */
const DEPTH = {
  artwork: { depthX: 10, depthY: 6 },
  arcs: { depthX: 18, depthY: 10 },
  portrait: { depthX: 27, depthY: 15 },
} as const;

/* -------------------------------------------------------------------------- */
/* Copy blocks                                                                */
/* -------------------------------------------------------------------------- */

/** One label sits still; several cycle through the single eyebrow slot. */
function RoleLabel({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;

  const labelClass =
    "font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-[rgba(248,241,231,0.65)]";

  return (
    <motion.div variants={fadeUp} className="flex items-center gap-3">
      <span className="h-[2px] w-[38px] bg-primary" />
      {labels.length === 1 ? (
        <span className={labelClass}>{labels[0]}</span>
      ) : (
        // 1.4em of window so the descender in "Developer" isn't clipped by
        // the roll's overflow-hidden slot.
        <InfiniteRollText
          words={labels}
          lineHeight={1.4}
          interval={2.6}
          className={labelClass}
        />
      )}
    </motion.div>
  );
}

/** Shared extrusion setup for both lines of the name.
 *
 * `depth × layers` is the total extrusion in px — at 36px it stays clear of
 * the line below, where the original 63px buried it. Brunson is a heavy
 * condensed face, so the slab behind each glyph eats into the gap to the next
 * one; the tracking here is set wide enough that the letters read as separate
 * shapes rather than one mass. */
const NAME_DEPTH = {
  layers: 24,
  depth: 1.5,
  faceMix: 18,
  shadowStrength: 0.18,
  tilt: 5,
  smoothing: 0.12,
  perspective: 1100,
  orbitSpeed: 0.16,
  fontSize: "clamp(4.75rem,8.4vw,10rem)",
  lineHeight: 0.94,
  letterSpacing: "0.06em",
} as const;

/** The hero name, extruded.
 *
 * One `DepthText` stack per line rather than one for the block, so each line
 * gets its own extrusion instead of one slab behind a two-line paragraph, and
 * so the second line can carry the burgundy face. `font-display` lives on the
 * `<h1>` — DepthText inherits the family and only owns size, weight and
 * tracking.
 *
 * Both depth colours are darker than their face so the extrusion always falls
 * *away* from the light: the face stays the brightest part of the stack. The
 * burgundy face is `--primary` (#5b0f18) exactly — see styles/globals.css —
 * and its depth colour sits *between* the background and that face in
 * luminance (~0.012 vs 0.003 and 0.026): any darker and the extrusion
 * vanishes into #0B0B0B and the word goes flat. */
function NameHeading({ name }: { name: string }) {
  const lines = nameLines(name);
  if (lines.length === 0) return null;

  return (
    <motion.h1
      variants={fadeUp}
      className="font-display text-[clamp(4.75rem,8.4vw,10rem)] leading-[0.94] text-foreground"
    >
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block">
          <DepthText
            {...NAME_DEPTH}
            text={line}
            faceColor={index === 0 ? "#f8f1e7" : "#5b0f18"}
            depthColor={index === 0 ? "#2e070d" : "#3a0a11"}
          />
        </span>
      ))}
    </motion.h1>
  );
}

function Headline({ tagline }: { tagline: string }) {
  if (!tagline) return null;

  return (
    <motion.p
      variants={fadeUp}
      className="mt-9 max-w-[440px] font-sans text-[clamp(1.75rem,2.4vw,2.125rem)] font-extrabold uppercase leading-[1.1] tracking-[0.01em] text-foreground"
    >
      {tagline}
    </motion.p>
  );
}

function Description({ bio }: { bio: string }) {
  if (!bio) return null;

  return (
    <motion.p
      variants={fadeUp}
      className="mt-7 max-w-[410px] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.6] text-[rgba(248,241,231,0.78)]"
    >
      {bio}
    </motion.p>
  );
}

/* -------------------------------------------------------------------------- */
/* Calls to action                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Three routes out of the hero, weighted the way PLAN.md's audience decision
 * asks for: the portfolio button carries the visual weight, while the
 * recruiter's CV and the client's "let's talk" sit beneath it as equals. Both
 * of those are text links rather than a second button because the left column
 * is only ~32vw wide — two 264px buttons would wrap onto separate lines and
 * push the composition past the fold.
 */
function CtaGroup({
  ctaLabel,
  ctaHref,
  contactLabel,
  contactHref,
  resumeLabel,
  resumeUrl,
}: {
  ctaLabel: string;
  ctaHref: string;
  contactLabel: string;
  contactHref: string;
  resumeLabel: string;
  resumeUrl: string | null;
}) {
  const showResume = Boolean(resumeUrl && resumeLabel);
  const showContact = Boolean(contactLabel);

  if (!ctaLabel && !showContact && !showResume) return null;

  return (
    <motion.div variants={fadeUp} className="mt-8">
      {ctaLabel && (
        // `btn-sweep` wipes burgundy across the button from the left edge on
        // hover; the arrow block shifts to the lighter hover tone so it stays
        // readable once the wipe reaches it.
        <Link
          href={ctaHref}
          className="btn-sweep group inline-flex h-14 w-[264px] items-stretch rounded-[4px] border border-foreground ring-brand [--sweep:var(--primary)]"
        >
          <span className="flex flex-1 items-center justify-center font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">
            {ctaLabel}
          </span>
          <span className="flex w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors duration-300 group-hover:bg-primary-hover">
            <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {(showContact || showResume) && (
        <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
          {showContact && (
            <Link href={contactHref} className={secondaryCtaClass}>
              {contactLabel}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              <UnderlineRule />
            </Link>
          )}

          {showResume && (
            <a
              href={resumeUrl as string}
              target="_blank"
              rel="noreferrer"
              // The CV is a PDF in Supabase Storage on another origin, where
              // `download` is ignored — opening it in a new tab is the honest
              // behaviour rather than a link that appears to save a file.
              className={secondaryCtaClass}
            >
              <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              {resumeLabel}
              <UnderlineRule />
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

const secondaryCtaClass =
  "group relative inline-flex items-center gap-2 pb-1 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-[rgba(248,241,231,0.72)] transition-colors hover:text-foreground ring-brand";

/** The burgundy rule that grows under a secondary CTA on hover. */
function UnderlineRule() {
  return (
    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
  );
}

/* -------------------------------------------------------------------------- */
/* Right-hand editorial column                                                */
/* -------------------------------------------------------------------------- */

function QuoteBlock({ words }: { words: string[] }) {
  if (words.length === 0) return null;

  return (
    // Self-contained animation: this block sits in the absolutely-positioned
    // right-hand layer, outside the `stagger` parent, so it can't inherit one.
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ delay: 0.45 }}
      variants={fadeUp}
      className="hidden max-w-60 xl:block"
    >
      <span className="font-editorial text-7xl leading-none text-primary">
        &ldquo;
      </span>
      {/* The words used to stack as static lines. They now cycle through a
          single slot, so the block is one line tall — the quote mark and rule
          carry the vertical mass. */}
      <p className="-mt-2 font-display text-[2.6rem] text-foreground">
        <InfiniteRollText
          words={words}
          activeClassName="text-primary"
          interval={1.9}
        />
      </p>
      <span className="mt-3 block h-px w-10 bg-foreground/40" />
    </motion.div>
  );
}

function SocialRow({
  label,
  socials,
  className,
}: {
  label: string;
  socials: HeroSocial[];
  className?: string;
}) {
  if (socials.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className={cn("flex flex-col items-end gap-3", className)}
    >
      {label && (
        <span className="font-editorial text-xl italic text-foreground-muted">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3.5">
        {socials.map(({ id, platform, url }) => {
          const Icon = socialIconFor(platform);
          // `mailto:`/`tel:` hand off to another app — a new tab would leave
          // an empty one behind.
          const external = /^https?:/i.test(url);

          return (
            <a
              key={id}
              href={url}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              aria-label={platform}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[rgba(248,241,231,0.25)] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Portrait                                                                   */
/* -------------------------------------------------------------------------- */

/** Desktop-only layered artwork + portrait.
 *
 * The portrait source is a square alpha PNG, so the stack is anchored as one
 * square box: horizontal centre at 53vw, top pinned at a fixed 178px. Because
 * the hair starts ~1.6% into the asset, a fixed top keeps the hair ~110px
 * clear of the 80px navbar at every width, instead of drifting the way a
 * percentage-of-container offset does. Width is capped three ways — 52vw for
 * the intended scale, 780px so it never oversizes, and 78vh so short viewports
 * (1366×768) keep the shoulders near the fold. The artwork and arcs are
 * children of that same box, so the whole composition scales as a unit.
 *
 * Each of the three planes is wrapped in a `ParallaxLayer`, which is the only
 * element carrying the pointer transform — the entrance animations below it
 * and the GSAP scrub above it both keep their own nodes. */
function DesktopPortraitArt({
  portraitUrl,
  artworkUrl,
  alt,
  parallax,
}: {
  portraitUrl: string;
  artworkUrl: string;
  alt: string;
  parallax: PointerParallax;
}) {
  return (
    <div
      data-fx="art"
      className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
    >
      <div className="absolute left-[53%] top-[178px] aspect-square w-[min(52vw,780px,78vh)] -translate-x-1/2">
        {/* Brush-stroke artwork — true alpha PNG, so it fades into #0B0B0B
            with no rectangular edge and no mix-blend-mode fakery. */}
        <ParallaxLayer parallax={parallax} name="artwork" {...DEPTH.artwork}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 top-[48%] aspect-[3/2] w-[150%] -translate-x-1/2 -translate-y-1/2"
          >
            <Image
              src={artworkUrl}
              alt=""
              fill
              unoptimized={isVectorImage(artworkUrl)}
              className="object-contain"
              sizes="1200px"
            />
          </motion.div>
        </ParallaxLayer>

        {/* Thin circular arcs */}
        <ParallaxLayer parallax={parallax} name="arcs" {...DEPTH.arcs}>
          <div className="absolute left-1/2 top-[46%] h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10" />
          <div className="absolute left-[44%] top-[42%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />
        </ParallaxLayer>

        {/* Portrait */}
        <ParallaxLayer parallax={parallax} name="portrait" {...DEPTH.portrait}>
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={portraitUrl}
              alt={alt}
              fill
              priority
              sizes="780px"
              unoptimized={isVectorImage(portraitUrl)}
              className={cn(
                "object-contain",
                "[mask-image:radial-gradient(ellipse_84%_92%_at_50%_42%,black_66%,transparent_97%)]",
                "[-webkit-mask-image:radial-gradient(ellipse_84%_92%_at_50%_42%,black_66%,transparent_97%)]",
              )}
            />
          </motion.div>
        </ParallaxLayer>
      </div>
    </div>
  );
}

/** No parallax here on purpose: there is no hovering pointer on a phone, and
 *  a device-orientation version would move the portrait while the reader is
 *  trying to read past it. */
function MobilePortrait({
  portraitUrl,
  artworkUrl,
  alt,
}: {
  portraitUrl: string;
  artworkUrl: string;
  alt: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative mx-auto my-8 h-[340px] w-full max-w-[340px] sm:h-[420px] sm:max-w-[420px]"
    >
      <div className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 opacity-70">
        <Image
          src={artworkUrl}
          alt=""
          fill
          sizes="460px"
          unoptimized={isVectorImage(artworkUrl)}
          className="object-contain"
        />
      </div>
      <Image
        src={portraitUrl}
        alt={alt}
        fill
        priority
        sizes="420px"
        unoptimized={isVectorImage(portraitUrl)}
        className={cn(
          "object-contain",
          "[mask-image:radial-gradient(ellipse_82%_94%_at_50%_44%,black_62%,transparent_97%)]",
          "[-webkit-mask-image:radial-gradient(ellipse_82%_94%_at_50%_44%,black_62%,transparent_97%)]",
        )}
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function HeroSectionContent({
  profile,
  socials,
  resumeUrl,
}: {
  profile: HeroProfile;
  socials: HeroSocial[];
  resumeUrl: string | null;
}) {
  const parallax = usePointerParallax();
  const portraitAlt = nameLines(profile.name).join(" ");

  const copy = (
    <>
      <RoleLabel labels={profile.role_labels} />
      <NameHeading name={profile.name} />
    </>
  );

  const pitch = (
    <>
      <Headline tagline={profile.tagline} />
      <Description bio={profile.bio} />
      <CtaGroup
        ctaLabel={profile.cta_label}
        ctaHref={profile.cta_href}
        contactLabel={profile.contact_cta_label}
        contactHref={profile.contact_cta_href}
        resumeLabel={profile.resume_cta_label}
        resumeUrl={resumeUrl}
      />
    </>
  );

  return (
    <section
      id="home"
      className="relative isolate min-h-screen overflow-hidden bg-background pt-20"
      {...parallax.handlers}
    >
      {/* Background — burgundy glow centred behind the portrait, plus film
          grain. Deliberately outside the parallax: it is the light in the
          room, and light does not move with the viewer. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[53%] top-[42%] h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.12] blur-[170px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.03] mix-blend-overlay" />
      </div>

      <DesktopPortraitArt
        portraitUrl={profile.portrait_image_url}
        artworkUrl={profile.artwork_image_url}
        alt={portraitAlt}
        parallax={parallax}
      />

      {/* Scroll effect 01 — the hero scrubs away as you leave it. */}
      <SectionScrollFx effect="cinematic-exit" />

      <div data-fx="lead" className="relative z-10">
        {/* Mobile / tablet stack */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col px-[6%] pb-16 pt-10 lg:hidden"
        >
          {copy}
          <MobilePortrait
            portraitUrl={profile.portrait_image_url}
            artworkUrl={profile.artwork_image_url}
            alt={portraitAlt}
          />
          {pitch}
        </motion.div>

        {/* Desktop three-zone grid: left 32% / center 43% / right 25%.

            The vertical padding is symmetric on purpose. The left column is
            centred in `100vh - 80px`, so on a short viewport (1366x768) the
            content is already taller than that box and starts flush against
            the navbar with no gap at all. Top padding alone would fix the gap
            but push the CTAs past the fold, so the same amount comes off the
            bottom: short viewports gain the full 40px of breathing room, tall
            ones gain half of it through the shifted centre. */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="hidden px-[clamp(24px,6.5vw,110px)] pb-10 pt-10 lg:grid lg:min-h-[calc(100vh-80px)] lg:grid-cols-[32%_43%_25%] lg:items-center"
        >
          <div className="relative z-10 flex flex-col justify-center">
            {copy}
            {pitch}
          </div>

          {/* Center + right — both reserved for absolutely-positioned layers */}
          <div aria-hidden />
          <div aria-hidden />
        </motion.div>
      </div>

      {/* Right editorial column — anchored to the section rather than the grid
          track so the insets are true viewport percentages (the grid's own
          horizontal padding clamps at 110px and would drift off-spec at 1920). */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
        <div className="pointer-events-auto absolute right-[8%] top-[30%]">
          <QuoteBlock words={profile.quote_words} />
        </div>
        <div className="pointer-events-auto absolute bottom-[15%] right-[8%]">
          <SocialRow label={profile.connect_label} socials={socials} />
        </div>
      </div>

      {/* Mobile-only social row */}
      <SocialRow
        label={profile.connect_label}
        socials={socials}
        className="mx-auto mb-14 mt-2 items-center px-[6%] text-center lg:hidden"
      />
    </section>
  );
}

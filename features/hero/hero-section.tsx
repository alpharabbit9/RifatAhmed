"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { DepthText } from "@/components/motion/depth-text";
import { InfiniteRollText } from "@/components/motion/infinite-roll-text";
import { cn } from "@/lib/utils";

const SOCIALS = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@rifatahmed.dev", label: "Email" },
];

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

function RoleLabel() {
  return (
    <motion.div variants={fadeUp} className="flex items-center gap-3">
      <span className="h-[2px] w-[38px] bg-primary" />
      <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-[rgba(248,241,231,0.65)]">
        Full Stack Developer
      </span>
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
 * Two `DepthText` stacks rather than one, so "Ahmed" keeps its burgundy face
 * and each line gets its own extrusion instead of one slab behind a two-line
 * block. `font-display` lives on the `<h1>` — DepthText inherits the family
 * and only owns size, weight and tracking.
 *
 * Both depth colours are darker than their face so the extrusion always falls
 * *away* from the light: the face stays the brightest part of the stack. */
function NameHeading() {
  return (
    <motion.h1
      variants={fadeUp}
      className="font-display text-[clamp(4.75rem,8.4vw,10rem)] leading-[0.94] text-foreground"
    >
      <span className="block">
        <DepthText
          {...NAME_DEPTH}
          text="Rifat"
          faceColor="#f8f1e7"
          depthColor="#2e070d"
        />
      </span>
      <span className="block">
        {/* Face is `--primary` (#5b0f18) exactly — see styles/globals.css.
            The depth colour is picked to sit *between* the background and
            that face in luminance (~0.012 vs 0.003 and 0.026): any darker and
            the extrusion vanishes into #0B0B0B and the word goes flat. */}
        <DepthText
          {...NAME_DEPTH}
          text="Ahmed"
          faceColor="#5b0f18"
          depthColor="#3a0a11"
        />
      </span>
    </motion.h1>
  );
}

function Headline() {
  return (
    <motion.p
      variants={fadeUp}
      className="mt-9 max-w-[440px] font-sans text-[clamp(1.75rem,2.4vw,2.125rem)] font-extrabold uppercase leading-[1.1] tracking-[0.01em] text-foreground"
    >
      Building products &amp; AI agents that make an impact.
    </motion.p>
  );
}

function Description() {
  return (
    <motion.p
      variants={fadeUp}
      className="mt-7 max-w-[410px] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.6] text-[rgba(248,241,231,0.78)]"
    >
      Full Stack Developer &amp; AI Agent Builder passionate about creating
      modern web apps, smart automations and meaningful digital experiences.
    </motion.p>
  );
}

function CtaButton() {
  return (
    <motion.div variants={fadeUp} className="mt-8">
      {/* `btn-sweep` wipes burgundy across the button from the left edge on
          hover; the arrow block shifts to the lighter hover tone so it stays
          readable once the wipe reaches it. */}
      <Link
        href="#projects"
        className="btn-sweep group inline-flex h-14 w-[264px] items-stretch rounded-[4px] border border-foreground ring-brand [--sweep:var(--primary)]"
      >
        <span className="flex flex-1 items-center justify-center font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">
          View My Work
        </span>
        <span className="flex w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors duration-300 group-hover:bg-primary-hover">
          <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function QuoteBlock() {
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
      {/* The four words used to stack as four static lines. They now cycle
          through a single slot, so the block is one line tall instead of
          four — the quote mark and rule carry the vertical mass. */}
      <p className="-mt-2 font-display text-[2.6rem] text-foreground">
        <InfiniteRollText
          words={["Code.", "Create.", "Automate.", "Repeat."]}
          activeClassName="text-primary"
          interval={1.9}
        />
      </p>
      <span className="mt-3 block h-px w-10 bg-foreground/40" />
    </motion.div>
  );
}

function SocialRow({ className }: { className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className={cn("flex flex-col items-end gap-3", className)}
    >
      <span className="font-editorial text-xl italic text-foreground-muted">
        Let&apos;s Connect
      </span>
      <div className="flex items-center gap-3.5">
        {SOCIALS.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[rgba(248,241,231,0.25)] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}

/** Desktop-only layered artwork + portrait.
 *
 * The portrait source is a square 500×500 alpha PNG, so the stack is anchored
 * as one square box: horizontal centre at 53vw, top pinned at a fixed 178px.
 * Because the hair starts ~1.6% into the asset, a fixed top keeps the hair
 * ~110px clear of the 80px navbar at every width, instead of drifting the way
 * a percentage-of-container offset does. Width is capped three ways — 52vw for
 * the intended scale, 780px so it never oversizes, and 78vh so short viewports
 * (1366×768) keep the shoulders near the fold. The artwork and arcs are
 * children of that same box, so the whole composition scales as a unit. */
function DesktopPortraitArt() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
      <div className="absolute left-[53%] top-[178px] aspect-square w-[min(52vw,780px,78vh)] -translate-x-1/2">
        {/* Brush-stroke artwork — true alpha PNG, so it fades into #0B0B0B
            with no rectangular edge and no mix-blend-mode fakery. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
          className="absolute left-1/2 top-[48%] aspect-[3/2] w-[150%] -translate-x-1/2 -translate-y-1/2"
        >
          <Image
            src="/images/art-bg-alpha.png"
            alt=""
            fill
            className="object-contain"
            sizes="1200px"
          />
        </motion.div>

        {/* Thin circular arcs */}
        <div className="absolute left-1/2 top-[46%] h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10" />
        <div className="absolute left-[44%] top-[42%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" />

        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="absolute inset-0"
        >
          <Image
            src="/images/hero.png"
            alt="Rifat Ahmed"
            fill
            priority
            sizes="780px"
            className={cn(
              "object-contain",
              "[mask-image:radial-gradient(ellipse_84%_92%_at_50%_42%,black_66%,transparent_97%)]",
              "[-webkit-mask-image:radial-gradient(ellipse_84%_92%_at_50%_42%,black_66%,transparent_97%)]",
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}

function MobilePortrait() {
  return (
    <motion.div
      variants={fadeUp}
      className="relative mx-auto my-8 h-[340px] w-full max-w-[340px] sm:h-[420px] sm:max-w-[420px]"
    >
      <div className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 opacity-70">
        <Image
          src="/images/art-bg-alpha.png"
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <Image
        src="/images/hero.png"
        alt="Rifat Ahmed"
        fill
        priority
        sizes="420px"
        className={cn(
          "object-contain",
          "[mask-image:radial-gradient(ellipse_82%_94%_at_50%_44%,black_62%,transparent_97%)]",
          "[-webkit-mask-image:radial-gradient(ellipse_82%_94%_at_50%_44%,black_62%,transparent_97%)]",
        )}
      />
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate min-h-screen overflow-hidden bg-background pt-20"
    >
      {/* Background — burgundy glow centred behind the portrait, plus film grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-[53%] top-[42%] h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.12] blur-[170px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.03] mix-blend-overlay" />
      </div>

      <DesktopPortraitArt />

      <div className="relative z-10">
        {/* Mobile / tablet stack */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col px-[6%] pb-16 pt-6 lg:hidden"
        >
          <RoleLabel />
          <NameHeading />
          <MobilePortrait />
          <Headline />
          <Description />
          <CtaButton />
        </motion.div>

        {/* Desktop three-zone grid: left 32% / center 43% / right 25% */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="hidden px-[clamp(24px,6.5vw,110px)] pb-16 lg:grid lg:min-h-[calc(100vh-80px)] lg:grid-cols-[32%_43%_25%] lg:items-center"
        >
          <div className="relative z-10 flex flex-col justify-center">
            <RoleLabel />
            <NameHeading />
            <Headline />
            <Description />
            <CtaButton />
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
          <QuoteBlock />
        </div>
        <div className="pointer-events-auto absolute bottom-[15%] right-[8%]">
          <SocialRow />
        </div>
      </div>

      {/* Mobile-only social row */}
      <SocialRow className="mx-auto mb-14 mt-2 items-center px-[6%] text-center lg:hidden" />
    </section>
  );
}

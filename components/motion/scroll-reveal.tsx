"use client";

/**
 * Scroll-driven motion primitives (Design_System.md §24).
 *
 * Built on Framer Motion — already a dependency, and it owns React-driven
 * entrance/hover motion for this project. Everything here is *triggered by
 * scroll position*: `Reveal`/`RevealGroup` fire once as an element crosses
 * into the viewport, `ParallaxLayer`/`ScrollRule` are continuously linked to
 * scroll progress.
 *
 * Every primitive collapses to a plain opacity fade (or nothing at all) under
 * `prefers-reduced-motion`, per §24's "subtle and intentional" rule.
 */

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

/** The editorial ease used across the site — a slow, confident settle. */
export const EASE_EDITORIAL: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

/* -------------------------------------------------------------------------- */
/* Reveal — one element, fires once on scroll-in                              */
/* -------------------------------------------------------------------------- */

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait after the trigger fires. */
  delay?: number;
  /** Travel distance in px. */
  distance?: number;
  /** Fraction of the element that must be visible to trigger (0–1). */
  amount?: number;
  /** Re-animate every time it re-enters the viewport. */
  repeat?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance = 26,
  amount = 0.3,
  repeat = false,
}: RevealProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, amount }}
      transition={{
        duration: reduce ? 0.25 : 0.7,
        delay: reduce ? 0 : delay,
        ease: EASE_EDITORIAL,
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* RevealGroup / RevealItem — staggered children                              */
/* -------------------------------------------------------------------------- */

export interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Gap between each child's start, in seconds. */
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  repeat?: boolean;
}

/**
 * Wraps a set of `RevealItem`s and cascades them in. Framer propagates the
 * "hidden"/"show" states down automatically, so items need no trigger of
 * their own — which keeps a single ScrollTrigger-equivalent per group rather
 * than one IntersectionObserver per child.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0.05,
  amount = 0.25,
  repeat = false,
}: RevealGroupProps) {
  const variants: Variants = React.useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: stagger, delayChildren } },
    }),
    [stagger, delayChildren],
  );

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: !repeat, amount }}
    >
      {children}
    </motion.div>
  );
}

export interface RevealItemProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}

export function RevealItem({
  children,
  className,
  distance = 24,
}: RevealItemProps) {
  const reduce = useReducedMotion() ?? false;

  const variants: Variants = React.useMemo(
    () => ({
      hidden: { opacity: 0, y: reduce ? 0 : distance },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0.25 : 0.65, ease: EASE_EDITORIAL },
      },
    }),
    [reduce, distance],
  );

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* MaskedLine — display type wiping up from behind its own baseline           */
/* -------------------------------------------------------------------------- */

export interface MaskedLineProps {
  children: React.ReactNode;
  className?: string;
  /** Applied to the clipping wrapper, not the moving text. */
  wrapperClassName?: string;
}

/**
 * The heavy-display reveal: an `overflow-hidden` frame with the text sliding
 * up from fully below it. Used one word per instance so a headline cascades.
 * Must be driven by a parent `RevealGroup`.
 */
export function MaskedLine({
  children,
  className,
  wrapperClassName,
}: MaskedLineProps) {
  const reduce = useReducedMotion() ?? false;

  const variants: Variants = React.useMemo(
    () => ({
      hidden: reduce ? { opacity: 0 } : { y: "110%" },
      show: {
        y: "0%",
        opacity: 1,
        transition: { duration: reduce ? 0.25 : 0.85, ease: EASE_EDITORIAL },
      },
    }),
    [reduce],
  );

  return (
    <span className={cn("block overflow-hidden pb-[0.08em]", wrapperClassName)}>
      <motion.span className={cn("block", className)} variants={variants}>
        {children}
      </motion.span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ParallaxLayer — continuous, scroll-linked drift                            */
/* -------------------------------------------------------------------------- */

export interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /** px offset when the element first enters the viewport. */
  from?: number;
  /** px offset when it leaves. */
  to?: number;
}

/**
 * Translates its child on the Y axis in proportion to how far the element has
 * travelled through the viewport. The ref sits on a static wrapper so the
 * transform never feeds back into its own scroll measurement.
 */
export function ParallaxLayer({
  children,
  className,
  from = 60,
  to = -60,
}: ParallaxLayerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const raw = useTransform(scrollYProgress, [0, 1], [from, to]);
  const y = useSpring(raw, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ScrollRule — a hairline that draws itself as the section scrolls           */
/* -------------------------------------------------------------------------- */

export interface ScrollRuleProps {
  className?: string;
}

export function ScrollRule({ className }: ScrollRuleProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.35"],
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <div ref={ref} className={cn("h-px w-full bg-border-light", className)}>
      <motion.div
        className="h-px w-full origin-left bg-primary"
        style={reduce ? { transform: "scaleX(1)" } : { scaleX }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ScrollMarquee — horizontal drift bound to scroll progress                  */
/* -------------------------------------------------------------------------- */

export interface ScrollMarqueeProps {
  children: React.ReactNode;
  className?: string;
  /** Percentage of its own width to travel across the scroll range. */
  distance?: number;
}

/**
 * Scroll-linked rather than time-linked, so it holds still when the page
 * does — §24 explicitly rules out "constant floating".
 */
export function ScrollMarquee({
  children,
  className,
  distance = -22,
}: ScrollMarqueeProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const raw = useTransform(scrollYProgress, [0, 1], ["0%", `${distance}%`]);
  const x = useSpring(raw, { stiffness: 70, damping: 28, mass: 0.5 });

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        className="flex w-max flex-nowrap items-center"
        style={reduce ? undefined : { x }}
      >
        {children}
      </motion.div>
    </div>
  );
}

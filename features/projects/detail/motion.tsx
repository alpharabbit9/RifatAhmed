"use client";

/**
 * The case study's entrance motion — two primitives, used everywhere.
 *
 * Deliberately *mount*-triggered rather than the site's scroll-triggered
 * `Reveal` (components/motion/scroll-reveal.tsx). A case study is a single
 * composition the visitor arrives at directly: the hero has to be settled the
 * instant the page paints, and the sections below it are short enough that
 * staggering them on scroll would mean a reader who scrolls fast beats the
 * animation. Everything simply rises once, on a small delay ladder.
 *
 * §25: opacity 0 → 1, y 20 → 0, and nothing else. Under
 * `prefers-reduced-motion` the travel drops and only the fade remains.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";

export interface RiseProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before this element starts. */
  delay?: number;
  /** Travel distance in px (§25 keeps this at 20). */
  distance?: number;
}

export function Rise({
  children,
  className,
  delay = 0,
  distance = 20,
}: RiseProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: distance }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE_EDITORIAL, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Staggered list — the feature items (§25)                                   */
/* -------------------------------------------------------------------------- */

/**
 * A `<ul>` whose `<RiseItem>` children rise one after another.
 *
 * The stagger lives on the parent's variants, so the items only need to
 * declare where they come from — see `RiseItem`.
 */
export function RiseList({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.ul
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: 0.08, delayChildren: delay } },
      }}
      initial="hidden"
      animate="shown"
      className={className}
    >
      {children}
    </motion.ul>
  );
}

export function RiseItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.li
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE_EDITORIAL },
        },
      }}
      className={className}
    >
      {children}
    </motion.li>
  );
}

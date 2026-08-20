"use client";

/**
 * Scroll parallax — depth layers driven by one shared scroll measurement.
 *
 * `ParallaxScene` measures its own progress through the viewport once and
 * publishes it on context; every `ParallaxLayer` inside derives its transform
 * from that single `MotionValue`. One `useScroll` per section rather than one
 * per element keeps the scroll handler cheap no matter how many layers a
 * composition ends up with.
 *
 * Complements `components/motion/scroll-reveal.tsx` (entrance reveals) —
 * this file is only about continuous, scroll-linked depth. Everything
 * flattens to a static layout under `prefers-reduced-motion` (§24).
 */

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

const ParallaxContext = React.createContext<MotionValue<number> | null>(null);

export interface ParallaxSceneProps {
  children: React.ReactNode;
  className?: string;
  /** Scroll range the progress is measured across — see Framer's `offset`. */
  offset?: [string, string];
  as?: "div" | "section";
  id?: string;
}

export function ParallaxScene({
  children,
  className,
  offset = ["start end", "end start"],
  as = "div",
  id,
}: ParallaxSceneProps) {
  const ref = React.useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    // Cast: Framer's offset type is a union of literal templates that a
    // plain `[string, string]` prop can't satisfy structurally.
    offset: offset as never,
  });

  // Smoothed once, centrally — layers read the eased value directly.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.35,
  });

  const inner = (
    <ParallaxContext.Provider value={smooth}>
      {children}
    </ParallaxContext.Provider>
  );

  // Branching rather than a dynamic tag keeps the ref types honest.
  return as === "section" ? (
    <section ref={ref} id={id} className={className}>
      {inner}
    </section>
  ) : (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      id={id}
      className={className}
    >
      {inner}
    </div>
  );
}

/** Raw scene progress (0 → 1), for transforms this file doesn't cover. */
export function useParallaxProgress(): MotionValue<number> | null {
  return React.useContext(ParallaxContext);
}

export interface ParallaxLayerProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Travel in px across the scene's full scroll range. Positive drifts the
   * layer up as the page scrolls down (the "further away" reading); negative
   * pushes it the other way, which reads as closer to the viewer.
   */
  depth?: number;
  /** Horizontal drift in px across the same range. */
  drift?: number;
  /** Scale at the scene's start and end. */
  scale?: [number, number];
  /** Opacity at the scene's start and end. */
  fade?: [number, number];
}

export function ParallaxLayer({
  children,
  className,
  depth = 60,
  drift = 0,
  scale,
  fade,
}: ParallaxLayerProps) {
  const progress = React.useContext(ParallaxContext);
  const reduce = useReducedMotion() ?? false;

  // Hooks must run unconditionally, so fall back to a constant progress value
  // when this layer is rendered outside a scene.
  const fallback = useSpring(0);
  const source = progress ?? fallback;

  const y = useTransform(source, [0, 1], [depth, -depth]);
  const x = useTransform(source, [0, 1], [drift, -drift]);
  const scaleValue = useTransform(source, [0, 1], scale ?? [1, 1]);
  const opacity = useTransform(source, [0, 1], fade ?? [1, 1]);

  if (reduce || !progress) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      style={{
        y,
        ...(drift ? { x } : {}),
        ...(scale ? { scale: scaleValue } : {}),
        ...(fade ? { opacity } : {}),
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Oversized display word bled across the background — the editorial
 * "watermark" behind a section. Drifts horizontally against the scroll so
 * the composition has depth without another image asset.
 */
export function ParallaxWatermark({
  children,
  className,
  drift = 90,
}: {
  children: React.ReactNode;
  className?: string;
  drift?: number;
}) {
  return (
    <ParallaxLayer
      drift={drift}
      depth={-30}
      className={cn("pointer-events-none select-none", className)}
    >
      <span
        aria-hidden
        className="block whitespace-nowrap font-display leading-none"
      >
        {children}
      </span>
    </ParallaxLayer>
  );
}

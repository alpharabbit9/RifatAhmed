"use client";

/**
 * Hero pointer-parallax — the portrait tracks the mouse.
 *
 * PLAN.md §"Motion/3D architecture" specifies a small, clamped offset with
 * lerp-based easing back toward centre. That is exactly what a Framer spring
 * over a normalised pointer position gives, so the composition stays the
 * layered `next/image` stack it is today (radial alpha masks, brush artwork,
 * arcs) instead of becoming a WebGL canvas that would have to reimplement the
 * masking as a texture.
 *
 * Two rules this file exists to honour:
 *
 *   · **It never touches an element GSAP owns.** `cinematic-exit` scrubs the
 *     `data-fx="art"` wrapper; the layers below live *inside* it, so the two
 *     transforms compose through the DOM instead of overwriting each other on
 *     one node (see components/motion/gsap/gsap-core.ts).
 *   · **It never touches an element with a Framer entrance either.** The
 *     portrait and the artwork already animate `y` on mount, and a motion
 *     value on the same axis of the same element would fight it — hence a
 *     wrapper layer per depth.
 *
 * Under `prefers-reduced-motion` no listener is attached and every layer
 * renders as a plain positioned div: the portrait stays static, not merely
 * slower (PLAN.md's final-pass check).
 */

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/** Lerp back toward centre — slow and heavy, so it reads as weight not lag. */
const SPRING = { stiffness: 48, damping: 18, mass: 0.9 } as const;

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

export type PointerParallax = {
  /** Normalised pointer offset from the section's centre, −1 … 1. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  enabled: boolean;
  /** Spread onto the element the pointer is measured against. */
  handlers: {
    onPointerMove?: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave?: () => void;
  };
};

export function usePointerParallax(): PointerParallax {
  const reduce = useReducedMotion() ?? false;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Touch and pen drags would jump the portrait across the screen in one
      // frame; only a hovering mouse gets the effect.
      if (event.pointerType !== "mouse") return;

      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      // Clamped so a pointer entering from outside the section (or a stale
      // rect mid-scroll) can never push the layers past the designed travel.
      rawX.set(clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2));
      rawY.set(clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2));
    },
    [rawX, rawY],
  );

  const handlePointerLeave = React.useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return {
    x,
    y,
    enabled: !reduce,
    handlers: reduce
      ? {}
      : { onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave },
  };
}

/**
 * One depth plane. `depthX`/`depthY` are the maximum travel in pixels — the
 * nearest layer (the portrait) moves furthest, which is what makes the stack
 * read as depth rather than as a single sliding picture.
 */
export function ParallaxLayer({
  parallax,
  name,
  depthX,
  depthY,
  className,
  children,
}: {
  parallax: PointerParallax;
  /** Names the plane in the DOM — the only handle a scroll/pointer probe has. */
  name: string;
  depthX: number;
  depthY: number;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useTransform(parallax.x, (value) => value * depthX);
  const y = useTransform(parallax.y, (value) => value * depthY);

  if (!parallax.enabled) {
    return (
      <div data-parallax={name} className={cn("absolute inset-0", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      data-parallax={name}
      style={{ x, y }}
      className={cn("absolute inset-0", className)}
    >
      {children}
    </motion.div>
  );
}

"use client";

/**
 * GSAP + ScrollTrigger foundation.
 *
 * PLAN.md's motion architecture splits the two engines by *responsibility*,
 * and this file is the GSAP half:
 *
 *   Framer Motion  entrance reveals and hover/tap states — one-shot, triggered
 *                  when an element crosses into view (`components/motion/
 *                  scroll-reveal.tsx`).
 *   GSAP           continuous, scroll-*linked* choreography — the effects that
 *                  play forwards and backwards as you scrub the page
 *                  (`section-scroll-fx.tsx`).
 *
 * The rule that keeps them from fighting: **never let both write to the same
 * element**. In practice GSAP animates wrapper/lane elements that Framer knows
 * nothing about, and Framer keeps animating the content inside them. Nested
 * transforms compose, so the two read as one motion system.
 *
 * Lenis needs no wiring here. It animates the *native* scroll position (see
 * `components/motion/smooth-scroll.tsx`), so ScrollTrigger's own scroll
 * listener already sees every frame — there is no proxy to install.
 */

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registers ScrollTrigger exactly once, on the client. */
export function registerGsap(): void {
  if (registered || typeof window === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  // Late-loading images and the local Brunson face both change layout after
  // hydration, which invalidates every start/end ScrollTrigger measured.
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  registered = true;
}

/**
 * `useLayoutEffect` that degrades to `useEffect` on the server.
 *
 * These components are client components but still render on the server for
 * the HTML pass, where `useLayoutEffect` logs a warning. Setting up
 * ScrollTriggers in a layout effect (rather than a passive one) matters: it
 * runs before paint, so a scrubbed element is never briefly visible at its
 * untransformed position.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Media query GSAP's `matchMedia` uses to gate every effect in this folder. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Desktop-only conditions, for effects that need real estate (3D, lanes). */
export const MOTION_OK_DESKTOP =
  "(prefers-reduced-motion: no-preference) and (min-width: 1024px)";

export { gsap, ScrollTrigger };

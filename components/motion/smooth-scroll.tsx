"use client";

/**
 * Lenis smooth scrolling — mounted once from the root layout.
 *
 * Lenis drives the *native* scroll position (it animates `scrollTop` rather
 * than transforming a wrapper), so everything already built on real scroll
 * keeps working untouched: Framer Motion's `useScroll` in
 * `components/motion/scroll-parallax.tsx` and `scroll-reveal.tsx`, the
 * navbar's scroll state, and `IntersectionObserver`-based reveals.
 *
 * `respectReducedMotion` defaults to `true`: users who ask for reduced motion
 * get 1:1 scroll and instant jumps, with no extra branching here.
 */

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/** Height of the fixed navbar (`pt-20` on the hero) — anchors clear it. */
const NAV_OFFSET = -80;

/**
 * The live instance, for the handful of places that need to drive scroll
 * imperatively (see `scrollToTop`). `null` until the layout effect runs, and
 * on the server.
 */
let instance: Lenis | null = null;

/**
 * Scroll to the top of the page through Lenis.
 *
 * Prefer this over `window.scrollTo({ behavior: "smooth" })`: the native
 * smooth scroll and Lenis's own animation loop both write `scrollTop` every
 * frame and visibly fight each other. Falls back to the native call if Lenis
 * hasn't mounted (or was torn down).
 */
export function scrollToTop({ immediate = false } = {}) {
  if (instance) {
    instance.scrollTo(0, {
      immediate,
      duration: 1.4,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    });
    return;
  }
  window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

/** True for `href="#about"` — a fragment on the page we're already on. */
function sameDocumentHash(anchor: HTMLAnchorElement) {
  const target = new URL(anchor.href, window.location.href);
  return (
    target.hash.length > 1 &&
    target.host === window.location.host &&
    target.pathname === window.location.pathname
  );
}

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      // Damping per frame. Lower = longer glide. 0.065 carries noticeably
      // further than the 0.09 default without crossing into the "the page
      // is ignoring me" territory that very low values produce.
      lerp: 0.065,
      // Slightly under 1 so a wheel notch travels less distance but the easing
      // has longer to express itself — this is what reads as "smoother",
      // where lowering lerp alone just reads as "heavier".
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      // Touch devices keep their native momentum — syncing it to Lenis fights
      // the OS scroller and feels worse than leaving it alone.
      syncTouch: false,
      // Rubber-banding past the ends belongs to the OS, not to us.
      overscroll: false,
      // Nested scrollers (the mobile menu, any overflow panel) scroll
      // themselves instead of stealing the page scroll.
      allowNestedScroll: true,
      autoRaf: true,
    });
    instance = lenis;

    /**
     * Anchor links, handled here rather than via Lenis's own `anchors`
     * option. Two reasons: Lenis doesn't `preventDefault`, so the browser's
     * instant fragment jump would race its animation; and the nav links are
     * `next/link`, whose click handler would kick off a router navigation on
     * top of that. Capturing on `document` lets us stop both before either
     * runs, then drive the one scroll we actually want.
     */
    const onClick = (event: MouseEvent) => {
      // Let the browser own modified clicks (new tab, download, …).
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (!sameDocumentHash(anchor)) return;

      const hash = new URL(anchor.href, window.location.href).hash;
      // Sections 4–6 aren't built yet, so some nav hrefs point at nothing.
      // Leave those to the browser instead of scrolling to an empty target.
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      // Anchor jumps are duration-based rather than lerped: a fixed 1.25s
      // with an exponential ease-out lands the same way whether the target is
      // one section down or the length of the page, where a lerp makes long
      // jumps feel like a slingshot.
      lenis.scrollTo(target as HTMLElement, {
        offset: NAV_OFFSET,
        duration: 1.25,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      });
      // Keep the address bar and back button in step with the scroll, which
      // is what the default jump would have done for us.
      window.history.pushState(null, "", hash);
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      lenis.destroy();
      instance = null;
    };
  }, []);

  return null;
}

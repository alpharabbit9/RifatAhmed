"use client";

/**
 * Scroll-linked GSAP choreography, one distinct effect per section.
 *
 * Usage is deliberately a *marker*, not a wrapper:
 *
 *     <section id="home">
 *       <SectionScrollFx effect="cinematic-exit" />
 *       <div data-fx="lead">…</div>
 *       <div data-fx="art">…</div>
 *     </section>
 *
 * The marker renders an empty hidden span, walks up to its nearest
 * `<section>`/`<footer>`, and drives the elements inside it that carry a
 * `data-fx` role. Two reasons for that shape rather than a wrapper component:
 *
 *   · Adding it to a section is two attributes and one line — it never
 *     restructures JSX that another phase owns, and it can't disturb a
 *     layout built on absolute positioning or grid placement.
 *   · The elements an effect needs are usually siblings in different corners
 *     of the tree (the hero's copy and its portrait live in separate stacking
 *     layers), which no single wrapper could enclose.
 *
 * Every effect is gated behind `prefers-reduced-motion: no-preference` via
 * `gsap.matchMedia`, so a reduced-motion visitor gets the static layout and
 * GSAP never writes a transform. Effects that need real estate (3D, lanes)
 * additionally gate on `min-width: 1024px`.
 *
 * See `gsap-core.ts` for the division of labour with Framer Motion — the
 * short version is that GSAP only ever animates elements Framer isn't
 * touching, so the two compose instead of fighting.
 */

import * as React from "react";
import {
  gsap,
  MOTION_OK,
  MOTION_OK_DESKTOP,
  registerGsap,
  ScrollTrigger,
  useIsomorphicLayoutEffect,
} from "./gsap-core";

export type SectionEffect =
  /** Hero — the whole composition scrubs away as you leave it. */
  | "cinematic-exit"
  /** About — the stack leans into the scroll and settles when you stop. */
  | "velocity-skew"
  /** Projects — the card stage tips up from the page as it arrives. */
  | "depth-stage"
  /** Career — the rail draws itself and the dates drift against the cards. */
  | "timeline-draw"
  /** Services — each row's columns travel at their own rate. */
  | "column-lanes"
  /** Footer — the columns rise as the page lands on them. */
  | "footer-rise";

/** Elements carrying `data-fx="<role>"` inside the host section. */
function role(host: HTMLElement, name: string): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>(`[data-fx="${name}"]`));
}

type EffectSetup = (host: HTMLElement, mm: gsap.MatchMedia) => void;

/* -------------------------------------------------------------------------- */
/* The effects                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Hero — a cinematic exit.
 *
 * Scrubbed across the hero's own height: the copy lifts and dissolves while
 * the portrait pushes the other way and scales up, so the two layers separate
 * as the section leaves rather than sliding away as one flat picture.
 */
const cinematicExit: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK, () => {
    const lead = role(host, "lead");
    const art = role(host, "art");
    if (!lead.length && !art.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: host,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });

    if (lead.length) {
      tl.to(lead, { yPercent: -13, opacity: 0, ease: "power1.in" }, 0);
    }
    if (art.length) {
      tl.to(art, { yPercent: 7, scale: 1.14, opacity: 0.12, ease: "none" }, 0);
    }
  });
};

/**
 * About — scroll-velocity skew.
 *
 * The signature GSAP flourish: the block leans in the direction of travel by
 * an amount proportional to scroll speed, then springs back to square once the
 * page stops. `getVelocity` only reports while scrolling, so a paused
 * `delayedCall` — restarted on every update — is what returns it to zero.
 * Capped at 3° so body copy never becomes hard to read.
 */
const velocitySkew: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK, () => {
    const targets = role(host, "skew");
    if (!targets.length) return;

    gsap.set(targets, { transformOrigin: "50% 50%" });

    const setSkew = gsap.quickTo(targets, "skewY", {
      duration: 0.5,
      ease: "power3",
    });

    const settle = gsap.delayedCall(0.14, () => setSkew(0)).pause();

    ScrollTrigger.create({
      trigger: host,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        setSkew(gsap.utils.clamp(-3, 3, self.getVelocity() / -460));
        settle.restart(true);
      },
    });
  });
};

/**
 * Projects — the stage tips up.
 *
 * The card stack arrives lying back on the page and rotates flat as it
 * reaches reading position, hinged on its bottom edge so the pile looks like
 * it is being dealt onto a table. Desktop only: the mobile layout is a plain
 * vertical run with no fixed frame to rotate.
 */
const depthStage: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK_DESKTOP, () => {
    for (const stage of role(host, "stage")) {
      gsap.fromTo(
        stage,
        {
          rotateX: 11,
          scale: 0.93,
          transformPerspective: 1600,
          transformOrigin: "50% 100%",
        },
        {
          rotateX: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top 94%",
            end: "top 42%",
            scrub: 0.5,
          },
        },
      );
    }
  });
};

/**
 * Career — the rail draws itself.
 *
 * Each segment's `scaleY` is tied to scroll position rather than fired once on
 * entry, so the line extends and retracts under the reader's own hand. The
 * date column drifts against its card at the same time, which is what gives
 * the timeline depth on desktop.
 */
const timelineDraw: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK, () => {
    for (const rail of role(host, "rail")) {
      gsap.fromTo(
        rail,
        { scaleY: 0, transformOrigin: "50% 0%" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rail,
            start: "top 84%",
            end: "bottom 62%",
            scrub: 0.4,
          },
        },
      );
    }
  });

  mm.add(MOTION_OK_DESKTOP, () => {
    for (const date of role(host, "date")) {
      gsap.fromTo(
        date,
        { y: 24 },
        {
          y: -24,
          ease: "none",
          scrollTrigger: {
            trigger: date.closest("li") ?? date,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5,
          },
        },
      );
    }
  });
};

/**
 * Services — column lanes.
 *
 * Within one row the ordinal/title, the summary and the deliverables each
 * travel at their own rate, so the three columns shear apart slightly and
 * recombine as the row passes the middle of the viewport. Depth grows with
 * lane index; the numbers are small on purpose — enough to feel dimensional,
 * not enough to break the row's horizontal alignment.
 */
const columnLanes: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK_DESKTOP, () => {
    for (const row of role(host, "row")) {
      const lanes = Array.from(
        row.querySelectorAll<HTMLElement>("[data-lane]"),
      );

      lanes.forEach((lane, index) => {
        const depth = 12 + index * 14;

        gsap.fromTo(
          lane,
          { y: depth },
          {
            y: -depth,
            ease: "none",
            scrollTrigger: {
              trigger: row,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });
    }
  });
};

/**
 * Footer — the landing.
 *
 * The columns rise into place as the footer enters, while the outline
 * wordmark above them travels the opposite way, so the page arrives at rest
 * rather than simply stopping.
 */
const footerRise: EffectSetup = (host, mm) => {
  mm.add(MOTION_OK, () => {
    const rise = role(host, "rise");
    const counter = role(host, "counter");
    if (!rise.length && !counter.length) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: host,
        start: "top bottom",
        end: "top 40%",
        scrub: 0.6,
      },
    });

    if (rise.length) tl.fromTo(rise, { y: 72 }, { y: 0, ease: "none" }, 0);
    if (counter.length) {
      tl.fromTo(counter, { y: -34 }, { y: 12, ease: "none" }, 0);
    }
  });
};

const EFFECTS: Record<SectionEffect, EffectSetup> = {
  "cinematic-exit": cinematicExit,
  "velocity-skew": velocitySkew,
  "depth-stage": depthStage,
  "timeline-draw": timelineDraw,
  "column-lanes": columnLanes,
  "footer-rise": footerRise,
};

/* -------------------------------------------------------------------------- */
/* The marker                                                                 */
/* -------------------------------------------------------------------------- */

export interface SectionScrollFxProps {
  effect: SectionEffect;
  /**
   * Re-run the setup when this changes — pass anything whose arrival adds or
   * removes `data-fx` elements (a list length, say). Element *content* needs
   * no key; only the set of animated nodes matters.
   */
  refreshKey?: string | number;
}

export function SectionScrollFx({ effect, refreshKey }: SectionScrollFxProps) {
  const markerRef = React.useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    registerGsap();

    const host = markerRef.current?.closest("section, footer");
    if (!(host instanceof HTMLElement)) return;

    // `gsap.context` records every animation and ScrollTrigger created inside
    // it, so one `revert()` undoes the whole effect — including the inline
    // styles it wrote — when the section unmounts or `effect` changes.
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => EFFECTS[effect](host, mm), host);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [effect, refreshKey]);

  return <span ref={markerRef} hidden aria-hidden="true" />;
}

"use client";

/**
 * Word-by-word illumination — the Contact section's scroll effect.
 *
 * The sentence starts dimmed and lights up one word at a time as the paragraph
 * crosses the viewport, scrubbed, so the reader's eye is pulled along the line
 * at the speed they are scrolling. It is the one place on the page where
 * scroll drives *reading* rather than layout.
 *
 * Implementation notes that matter:
 *
 *   · Words are wrapped at render, not by rewriting the DOM afterwards —
 *     React owns this subtree and would happily reconcile spans away.
 *   · The spans stay `inline` (opacity animates fine on inline boxes) and the
 *     whitespace between them is preserved as its own text node, so line
 *     breaking is byte-for-byte what the plain string would have produced.
 *   · The dim state is written by GSAP, never by CSS. With JavaScript off,
 *     reduced motion on, or GSAP failing to load, the sentence renders at full
 *     contrast — the text is never left unreadable by a missing animation.
 */

import * as React from "react";
import {
  gsap,
  MOTION_OK,
  registerGsap,
  useIsomorphicLayoutEffect,
} from "./gsap-core";

export interface GsapWordsProps {
  /** The sentence. Split on whitespace; markup is not parsed. */
  text: string;
  className?: string;
  /** Opacity of a word before the scrub reaches it. */
  dim?: number;
}

export function GsapWords({ text, className, dim = 0.24 }: GsapWordsProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    registerGsap();

    const host = ref.current;
    if (!host) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add(MOTION_OK, () => {
        const words = host.querySelectorAll<HTMLElement>("[data-word]");
        if (!words.length) return;

        gsap.fromTo(
          words,
          { opacity: dim },
          {
            opacity: 1,
            ease: "none",
            // Scrubbed stagger: the tween's own timeline is mapped onto the
            // scroll range, so the "reading head" tracks the scrollbar.
            stagger: 0.4,
            scrollTrigger: {
              trigger: host,
              start: "top 88%",
              end: "bottom 58%",
              scrub: 0.45,
            },
          },
        );
      });
    }, host);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [text, dim]);

  // Splitting on a captured group keeps the separators in the array, so the
  // whitespace is re-emitted verbatim between the word spans.
  const chunks = React.useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <span ref={ref} className={className}>
      {chunks.map((chunk, index) =>
        /^\s+$/.test(chunk) ? (
          <React.Fragment key={index}>{chunk}</React.Fragment>
        ) : (
          <span key={index} data-word>
            {chunk}
          </span>
        ),
      )}
    </span>
  );
}

"use client";

/**
 * Rolling text — the per-character "slot machine" reveal used on section
 * headers.
 *
 * Written against Framer Motion (already a project dependency) rather than
 * pulled from a component registry, so it inherits the site's editorial ease
 * and `prefers-reduced-motion` rules instead of a third-party default.
 *
 * How the roll works: every character is a 1-line window (`overflow-hidden`)
 * containing the SAME glyph twice, stacked vertically. The column is animated
 * between three positions:
 *
 *   hidden  y = " 50%"  → window sits above both copies (blank)
 *   show    y = "  0%"  → the top copy fills the window
 *   roll    y = "-50%"  → the top copy exits, the bottom copy takes its place
 *
 * Because the two copies are identical, snapping from `roll` back to `show`
 * afterwards is invisible — which is what makes the hover replay repeatable.
 */

import * as React from "react";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";

export interface RollingTextProps {
  /** Plain text. Split on spaces so words never break across lines. */
  text: string;
  className?: string;
  /** Seconds between consecutive characters. */
  stagger?: number;
  duration?: number;
  /** Fraction of the element that must be on screen to trigger. */
  amount?: number;
  /** Replay the roll when the pointer enters. */
  hoverReplay?: boolean;
  /** Rendered inside this tag — use a heading level that fits the outline. */
  as?: "span" | "h1" | "h2" | "h3" | "p";
  /**
   * Height of one character window, in `em`. Each stacked copy is given the
   * same line-height, so a `-50%` shift lands exactly one copy up — the
   * window and the roll distance can never drift apart. Raise it if a
   * typeface's descenders clip.
   */
  lineHeight?: number;
}

export function RollingText({
  text,
  className,
  stagger = 0.03,
  duration = 0.62,
  amount = 0.6,
  hoverReplay = true,
  as = "span",
  lineHeight = 1.06,
}: RollingTextProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const controls = useAnimationControls();
  const rolling = React.useRef(false);

  // Reduced motion keeps the identical DOM — the characters simply start (and
  // stay) in place. Swapping in a plain-text branch instead would change the
  // tree between server and client render and trip hydration.
  const variants: Variants = React.useMemo(
    () => ({
      hidden: { y: reduce ? "0%" : "50%" },
      show: (i: number) => ({
        y: "0%",
        transition: reduce
          ? { duration: 0 }
          : { duration, delay: i * stagger, ease: EASE_EDITORIAL },
      }),
      roll: (i: number) => ({
        y: "-50%",
        transition: {
          duration: duration * 0.75,
          delay: i * stagger,
          ease: EASE_EDITORIAL,
        },
      }),
    }),
    [duration, stagger, reduce],
  );

  React.useEffect(() => {
    if (inView) {
      void controls.start("show");
    }
  }, [inView, controls]);

  async function replay() {
    if (!hoverReplay || reduce || rolling.current || !inView) return;
    rolling.current = true;
    await controls.start("roll");
    // The two copies are identical, so this reset never shows a jump.
    controls.set("show");
    rolling.current = false;
  }

  const Tag = motion[as] as typeof motion.span;

  const words = text.split(" ");
  let charIndex = -1;

  return (
    <Tag
      ref={ref as React.Ref<HTMLSpanElement>}
      className={cn("inline-flex flex-wrap", className)}
      onHoverStart={replay}
    >
      {/* The full string stays in the a11y tree; the glyph soup is hidden. */}
      <span className="sr-only">{text}</span>

      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} aria-hidden className="inline-flex">
          {[...word].map((char, i) => {
            charIndex += 1;
            return (
              <span
                key={`${char}-${i}`}
                className="inline-block overflow-hidden align-bottom"
                // Exactly one line tall — the column inside is two.
                style={{ height: `${lineHeight}em` }}
              >
                <motion.span
                  className="block"
                  custom={charIndex}
                  variants={variants}
                  initial="hidden"
                  animate={controls}
                >
                  <span className="block" style={{ lineHeight }}>
                    {char}
                  </span>
                  <span className="block" style={{ lineHeight }}>
                    {char}
                  </span>
                </motion.span>
              </span>
            );
          })}

          {wordIndex < words.length - 1 && (
            // Matches the character windows so the baseline never steps.
            <span
              className="inline-block align-bottom"
              style={{ height: `${lineHeight}em`, lineHeight }}
            >
              &nbsp;
            </span>
          )}
        </span>
      ))}
    </Tag>
  );
}

/**
 * Stacked display lines, each one rolling in after the last — the treatment
 * used for the "Build. / Solve. / Learn." heading.
 */
export function RollingLines({
  lines,
  className,
  lineClassName,
  accentLast = false,
  stagger = 0.03,
  // Tighter than the single-line default: stacked display lines set close.
  lineHeight = 1.02,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Render the final line in burgundy (§4's one-accent-per-block rule). */
  accentLast?: boolean;
  stagger?: number;
  lineHeight?: number;
}) {
  return (
    <span className={cn("block", className)}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block">
          <RollingText
            text={line}
            stagger={stagger}
            amount={0.35}
            lineHeight={lineHeight}
            className={cn(
              lineClassName,
              accentLast && index === lines.length - 1 && "text-primary",
            )}
          />
        </span>
      ))}
    </span>
  );
}

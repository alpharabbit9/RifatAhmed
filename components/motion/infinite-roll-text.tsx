"use client";

/**
 * Infinite roll — one line-height window with a column of words behind it,
 * stepping up one word at a time, forever.
 *
 * Distinct from `RollingText` in the same folder: that one rolls a string's
 * characters *once* as it scrolls into view. This one cycles a *list* through
 * a single slot on a timer and never settles.
 *
 * The seam: the column repeats `words[0]` at the end, so the step from the
 * last word lands on a copy of the first. That frame is visually identical to
 * the start, which is where the transition-less snap back to index 0 happens
 * — so the cycle has no rewind.
 *
 * Under `prefers-reduced-motion` the timer never starts and the first word
 * simply stays put.
 */

import * as React from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";

export interface InfiniteRollTextProps {
  /** Words cycled through the slot, in order. */
  words: string[];
  /** Seconds each word is held before the next step. */
  interval?: number;
  /** Seconds the step itself takes. */
  duration?: number;
  className?: string;
  /** Applied to the word at the active index — used for the accent word. */
  activeClassName?: string;
  /** Index that gets `activeClassName`. Defaults to the last word. */
  accentIndex?: number;
  /**
   * Height of the window, in `em`. The column's line-height matches, so one
   * step is always exactly one word — the window and the travel can't drift.
   */
  lineHeight?: number;
}

export function InfiniteRollText({
  words,
  interval = 1.9,
  duration = 0.72,
  className,
  activeClassName,
  accentIndex,
  lineHeight = 1,
}: InfiniteRollTextProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = React.useRef<HTMLSpanElement>(null);
  // Off-screen the timer is pointless — the hero sits above a long page.
  const inView = useInView(ref, { amount: 0.4 });
  const [index, setIndex] = React.useState(0);
  // True only for the frame that rewinds to the top of the column.
  const [snapping, setSnapping] = React.useState(false);

  const accent = accentIndex ?? words.length - 1;
  // The trailing duplicate of the first word is what makes the wrap seamless.
  const column = React.useMemo(() => [...words, words[0]], [words]);

  React.useEffect(() => {
    if (reduce || !inView || words.length < 2) return;

    const id = window.setInterval(() => {
      setSnapping(false);
      setIndex((i) => i + 1);
    }, interval * 1000);
    return () => window.clearInterval(id);
  }, [reduce, inView, interval, words.length]);

  /**
   * The last word animates *onto* the duplicate first word normally. Once
   * that step has finished the column is showing a copy of word 0, so
   * jumping back to the real index 0 changes nothing on screen — and doing
   * it with the transition switched off is what makes the loop endless
   * instead of visibly rewinding.
   */
  React.useEffect(() => {
    if (index !== words.length) return;
    const id = window.setTimeout(() => {
      setSnapping(true);
      setIndex(0);
    }, duration * 1000);
    return () => window.clearTimeout(id);
  }, [index, words.length, duration]);

  return (
    <span
      ref={ref}
      className={cn("block overflow-hidden", className)}
      style={{ height: `${lineHeight}em` }}
    >
      {/* The whole list stays readable to assistive tech; the moving column
          is decorative, since only one word is ever legible on screen. */}
      <span className="sr-only">{words.join(" ")}</span>

      {/* A percentage `y` resolves against the *column's* height, not one
          word's — so one step is 100 / column.length, not 100. */}
      <motion.span
        aria-hidden
        className="block"
        animate={{ y: `-${(index * 100) / column.length}%` }}
        transition={
          snapping ? { duration: 0 } : { duration, ease: EASE_EDITORIAL }
        }
      >
        {column.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              "block",
              // The duplicate at the end must match whatever the real first
              // word looks like, or the seam would flicker colour.
              (i === accent || (i === words.length && accent === 0)) &&
                activeClassName,
            )}
            style={{ lineHeight }}
          >
            {word}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

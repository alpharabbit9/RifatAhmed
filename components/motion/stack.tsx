"use client";

/**
 * Stack — the React Bits card stack (JS + CSS variant), ported to TypeScript
 * and rebuilt on the `framer-motion` this project already ships (upstream
 * imports `motion/react`, a second copy of the same library).
 *
 * Cards sit on top of each other, fanned by a few degrees and scaled back by
 * depth. Dragging the top card past `sensitivity` sends it to the bottom, so
 * the reader flicks through a small set the way you would through a pile of
 * prints — see `features/projects/projects-content.tsx` for the real use.
 *
 * Changes over the upstream component, all deliberate:
 *
 *   · **Order lives in an index array, not a cloned card list.** Upstream
 *     copies `cards` into state and re-syncs on `[cards]`; since a parent
 *     almost always builds that array inline (`projects.map(...)`), the
 *     identity changes every render and the shuffle resets. Here state is the
 *     render order of *indices* and only rebuilds when the count changes, so
 *     card content stays live while the order survives re-renders.
 *   · **The top card is scale 1.** Upstream's formula leaves it at
 *     `1 - scaleStep`, which quietly shrinks a full-bleed card.
 *   · **`randomRotation` is applied after mount.** `Math.random()` during
 *     render disagrees between the server and the client pass, and Framer
 *     writes `animate` straight to inline styles when `initial={false}` — a
 *     hydration mismatch. The wobble is drawn in an effect instead.
 *   · **`rotationStep` / `scaleStep` / `tilt` / `perspective` / `cardRadius`
 *     are props.** Upstream hard-codes 4°, 0.06 and 60° of tilt against a
 *     208px thumbnail; a 1400px panel needs a fraction of each.
 *   · **`indicators`** adds a labelled dot per card. Drag is a mouse-only,
 *     undiscoverable affordance; when the cards contain links there has to be
 *     a keyboard path to them. Cards below the top are `inert` so focus never
 *     lands on a card nobody can see.
 *   · No Unsplash fallback deck — an empty `cards` array renders nothing.
 *
 * Honours `prefers-reduced-motion`: the 3D tilt flattens and autoplay is
 * suppressed (the reader still drags or taps through at their own pace).
 */

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { cn } from "@/lib/utils";
import "./stack.css";

export interface StackAnimationConfig {
  stiffness: number;
  damping: number;
}

/* -------------------------------------------------------------------------- */
/* One card's drag + tilt wrapper                                             */
/* -------------------------------------------------------------------------- */

function StackCardRotate({
  children,
  onSendToBack,
  sensitivity,
  tilt,
  draggable,
}: {
  children: React.ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  tilt: number;
  draggable: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Pull the card toward the pointer in 3D: dragging left tips the right edge
  // away, dragging down tips the top edge back.
  const rotateX = useTransform(y, [-100, 100], [tilt, -tilt]);
  const rotateY = useTransform(x, [-100, 100], [-tilt, tilt]);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      onSendToBack();
    }
    // `dragConstraints` springs the card home either way; resetting the
    // motion values keeps the tilt from lingering after a throw.
    x.set(0);
    y.set(0);
  }

  if (!draggable) {
    return <div className="stack-rotate--static">{children}</div>;
  }

  return (
    <motion.div
      className="stack-rotate"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stack                                                                      */
/* -------------------------------------------------------------------------- */

export interface StackProps {
  /** The pile, front card last. Rendered in place, so content stays live. */
  cards?: React.ReactNode[];
  /** Scatters each card by up to ±1.25 × `rotationStep` for a messy pile. */
  randomRotation?: boolean;
  /** Drag distance, in px, that sends the top card to the back. */
  sensitivity?: number;
  animationConfig?: StackAnimationConfig;
  /** Also advance on click. Leave off when the cards contain their own links. */
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  /** Swap drag for tap below `mobileBreakpoint`. */
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  /** Degrees of fan between one card and the next. */
  rotationStep?: number;
  /** How much smaller each card behind the top one is drawn. */
  scaleStep?: number;
  /** Maximum degrees of pointer-driven 3D tilt while dragging. */
  tilt?: number;
  /** Depth of the 3D scene, in px — scale it with the card. */
  perspective?: number;
  /** Corner radius used when `clip` is on. Any CSS length. */
  cardRadius?: string;
  transformOrigin?: string;
  /** Clip children to `cardRadius`. Off for cards that round themselves. */
  clip?: boolean;
  /** Renders one dot per card, each bringing its card to the front. */
  indicators?: boolean;
  /** Accessible name for dot `index` (0-based) of `total`. */
  indicatorLabel?: (index: number, total: number) => string;
  className?: string;
  cardClassName?: string;
}

export function Stack({
  cards = [],
  randomRotation = false,
  sensitivity = 200,
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  rotationStep = 4,
  scaleStep = 0.06,
  tilt = 60,
  perspective = 600,
  cardRadius = "1rem",
  transformOrigin = "90% 90%",
  clip = true,
  indicators = false,
  indicatorLabel = (index, total) => `Show card ${index + 1} of ${total}`,
  className,
  cardClassName,
}: StackProps) {
  const reduce = useReducedMotion() ?? false;
  const count = cards.length;

  // Render order, back to front. Values index into `cards`.
  const [order, setOrder] = React.useState<number[]>(() =>
    cards.map((_, index) => index),
  );

  React.useEffect(() => {
    setOrder((prev) =>
      prev.length === count ? prev : Array.from({ length: count }, (_, i) => i),
    );
  }, [count]);

  // Per-card wobble in [-1, 1], drawn after mount so the server and the first
  // client render agree (see the header note).
  const [wobble, setWobble] = React.useState<number[]>([]);

  React.useEffect(() => {
    setWobble(
      randomRotation
        ? Array.from({ length: count }, () => Math.random() * 2 - 1)
        : [],
    );
  }, [randomRotation, count]);

  const [isNarrow, setIsNarrow] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const sync = () => setIsNarrow(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [mobileBreakpoint]);

  const [isPaused, setIsPaused] = React.useState(false);

  const draggable = !(mobileClickOnly && isNarrow);
  const advanceOnClick = sendToBackOnClick || !draggable;

  const sendToBack = React.useCallback((card: number) => {
    setOrder((prev) => [card, ...prev.filter((value) => value !== card)]);
  }, []);

  const bringToFront = React.useCallback((card: number) => {
    setOrder((prev) => [...prev.filter((value) => value !== card), card]);
  }, []);

  React.useEffect(() => {
    if (!autoplay || reduce || isPaused || count < 2) return;

    const timer = setInterval(() => {
      // Functional update: the interval never has to be torn down and rebuilt
      // just because the order moved.
      setOrder((prev) =>
        prev.length < 2 ? prev : [prev[prev.length - 1], ...prev.slice(0, -1)],
      );
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, reduce, isPaused, count]);

  if (count === 0) return null;

  const topCard = order[order.length - 1];

  return (
    <div
      className={cn("stack", className)}
      style={
        {
          "--stack-perspective": `${perspective}px`,
          "--stack-card-radius": cardRadius,
        } as React.CSSProperties
      }
      onMouseEnter={pauseOnHover ? () => setIsPaused(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setIsPaused(false) : undefined}
    >
      <div className="stack-container">
        {order.map((card, position) => {
          // 0 for the card on top, growing toward the back of the pile.
          const depth = order.length - position - 1;
          const scatter = (wobble[card] ?? 0) * rotationStep * 1.25;

          return (
            <StackCardRotate
              key={card}
              onSendToBack={() => sendToBack(card)}
              sensitivity={sensitivity}
              tilt={reduce ? 0 : tilt}
              draggable={draggable}
            >
              <motion.div
                className={cn(
                  "stack-card",
                  clip && "stack-card--clip",
                  cardClassName,
                )}
                // Buried cards keep their DOM (the shuffle is animated, not
                // remounted) but must not be reachable or announced.
                inert={depth > 0}
                onClick={advanceOnClick ? () => sendToBack(card) : undefined}
                style={{ transformOrigin, zIndex: position }}
                initial={false}
                animate={{
                  rotateZ: depth * rotationStep + scatter,
                  scale: 1 - depth * scaleStep,
                }}
                transition={{
                  type: "spring",
                  stiffness: animationConfig.stiffness,
                  damping: animationConfig.damping,
                }}
              >
                {cards[card]}
              </motion.div>
            </StackCardRotate>
          );
        })}
      </div>

      {indicators && count > 1 && (
        <div
          role="group"
          aria-label="Choose a card"
          // Generous top margin: cards at the back of a fanned pile hang below
          // the top card's bottom edge, and the dots have to clear them.
          className="mt-11 flex shrink-0 items-center justify-center gap-2.5"
        >
          {cards.map((_, index) => {
            const isTop = topCard === index;

            return (
              <button
                key={index}
                type="button"
                onClick={() => bringToFront(index)}
                aria-label={indicatorLabel(index, count)}
                aria-current={isTop ? "true" : undefined}
                // `bg-current` throughout, so the dots inherit whatever the
                // surrounding text colour is rather than pinning a palette.
                className={cn(
                  "h-2.5 rounded-full bg-current transition-all duration-300 ease-out",
                  "ring-offset-2 ring-offset-background focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-current",
                  isTop ? "w-9 opacity-100" : "w-2.5 opacity-35 hover:opacity-70",
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Stack;

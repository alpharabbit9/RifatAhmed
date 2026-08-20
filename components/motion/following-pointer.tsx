"use client";

/**
 * Following pointer — the Aceternity "FollowerPointerCard" effect, rebuilt on
 * Framer Motion and re-coloured for this palette.
 *
 * Why a local build rather than `npx shadcn add @aceternity/following-pointer`:
 * that registry item imports `motion/react` and would pull in the `motion`
 * package alongside the `framer-motion` this project already ships, and it
 * writes into the shared `components/ui/` folder. The API here is the same
 * (`<FollowerPointerCard title={…}>`), minus the demo's random rainbow label
 * colour — the cursor is Burgundy Wine on Soft Cream, per Design_System.md.
 *
 * Two fixes over the upstream implementation:
 *   · the container rect is re-measured on every move instead of once on
 *     mount, so the cursor stays glued to the real pointer after the page has
 *     scrolled or the layout has reflowed;
 *   · the native cursor is only hidden for fine pointers (a mouse). On touch
 *     and under `prefers-reduced-motion` the children render untouched.
 */

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/** Matches the editorial ease used across the site. */
const SPRING = { stiffness: 620, damping: 42, mass: 0.45 } as const;

/** True for mouse/trackpad input; false on touch-only devices. */
function useFinePointer() {
  const [fine, setFine] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return fine;
}

export interface FollowerPointerCardProps {
  children: React.ReactNode;
  className?: string;
  /** Label that trails the cursor. Omit for the arrow on its own. */
  title?: React.ReactNode;
}

export function FollowerPointerCard({
  children,
  className,
  title,
}: FollowerPointerCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isInside, setIsInside] = React.useState(false);

  const finePointer = useFinePointer();
  const reduce = useReducedMotion() ?? false;
  const enabled = finePointer && !reduce;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    rawX.set(event.clientX - rect.left);
    rawY.set(event.clientY - rect.top);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    // Seed the position before the first frame so the cursor appears where
    // the mouse actually entered rather than springing in from the corner.
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      rawX.jump(event.clientX - rect.left);
      rawY.jump(event.clientY - rect.top);
      x.jump(event.clientX - rect.left);
      y.jump(event.clientY - rect.top);
    }
    setIsInside(true);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={enabled ? handleMouseEnter : undefined}
      onMouseMove={enabled ? handleMouseMove : undefined}
      onMouseLeave={enabled ? () => setIsInside(false) : undefined}
      style={enabled ? { cursor: "none" } : undefined}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {enabled && isInside && <FollowPointer x={x} y={y} title={title} />}
      </AnimatePresence>
      {children}
    </div>
  );
}

export function FollowPointer({
  x,
  y,
  title,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  title?: React.ReactNode;
}) {
  return (
    <motion.div
      aria-hidden
      style={{ top: y, left: x, pointerEvents: "none" }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute z-50 h-4 w-4"
    >
      {/* Burgundy arrow with a cream outline — legible on the black card and
          on the cream panel alike.
          The source path points up-and-right; `scaleX(-1)` mirrors it so the
          tip leads toward the top-left the way a real cursor does, and the
          translate puts that tip exactly on the pointer position. */}
      <svg
        viewBox="0 0 16 16"
        className="h-6 w-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
        style={{ transform: "translate(-3px, -3px) scaleX(-1)" }}
        fill="var(--primary)"
        stroke="var(--foreground)"
        strokeWidth="1"
        strokeLinejoin="round"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
      </svg>

      {title && (
        <motion.span
          initial={{ scale: 0.85, opacity: 0, y: -4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute left-6 top-6 block min-w-max rounded-md border px-2.5 py-1.5",
            "border-[rgba(248,241,231,0.22)] bg-primary text-primary-foreground",
            "font-sans text-[11px] font-semibold uppercase tracking-[0.14em]",
            "shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          )}
        >
          {title}
        </motion.span>
      )}
    </motion.div>
  );
}

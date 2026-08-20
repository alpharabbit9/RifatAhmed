"use client";

/**
 * The case study's right column — the primary screenshot frame plus the
 * thumbnail strip, prev/next controls and pagination dots (§15, §16).
 *
 * The one genuinely interactive piece on the page, so the one Client
 * Component that owns state. Everything it needs arrives as plain data.
 *
 * Behaviour:
 *   · clicking a thumbnail, a dot, or prev/next swaps the primary image
 *   · prev/next wrap around, so the strip never dead-ends
 *   · ← / → move through the gallery whenever focus is inside it
 *   · the swap crossfades with a 0.99 → 1 scale — no slide, no carousel slide
 *
 * Images are `object-contain` inside a fixed 16:10 frame: a screenshot is
 * never cropped and never stretched (§15), and the letterbox is the frame's
 * own near-black, so a 16:9 shot reads as flush. Only the first image is
 * `priority`; the rest — and every thumbnail — load lazily (§31).
 *
 * An empty gallery renders the placeholder frame alone: no strip, no controls,
 * no dots.
 */

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_EDITORIAL } from "@/components/motion/scroll-reveal";
import {
  ACCENT_BORDER,
  ACCENT_TINT,
  BORDER_FRAME,
  BORDER_SUBTLE,
} from "@/features/projects/detail/tokens";
import type { CaseStudyImage } from "@/features/projects/types";

/* -------------------------------------------------------------------------- */
/* Primary frame                                                              */
/* -------------------------------------------------------------------------- */

function PlaceholderFrame() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3"
      style={{
        backgroundImage:
          "radial-gradient(90% 90% at 70% 10%, color-mix(in srgb, var(--primary) 30%, transparent) 0%, transparent 70%)",
      }}
    >
      <ImageOff
        aria-hidden
        className="h-7 w-7"
        strokeWidth={1.4}
        style={{ color: ACCENT_TINT }}
      />
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(248,241,231,0.45)]">
        Screenshot coming soon
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export interface ProjectGalleryProps {
  images: CaseStudyImage[];
  /** Used for the alt text of any image that didn't get its own. */
  title: string;
  className?: string;
}

export function ProjectGallery({ images, title, className }: ProjectGalleryProps) {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = React.useState(0);
  const [broken, setBroken] = React.useState<Record<number, boolean>>({});

  const count = images.length;
  const active = images[index] ?? null;
  const hasStrip = count > 1;

  /** Jump to an absolute position — a thumbnail or a dot. */
  const select = React.useCallback(
    (position: number) => {
      if (count === 0) return;
      setIndex(((position % count) + count) % count);
    },
    [count],
  );

  /**
   * Move by one, wrapping in both directions.
   *
   * The update is functional rather than `select(index ± 1)`: two clicks
   * inside the same render (a fast double-click, or a held arrow key) would
   * otherwise both read the same captured `index` and advance a single step.
   */
  const step = React.useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((current) => (((current + delta) % count) + count) % count);
    },
    [count],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasStrip) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  };

  const altFor = (image: CaseStudyImage, position: number) =>
    image.alt?.trim()
      ? image.alt
      : `${title} screenshot ${position + 1} of ${count}`;

  return (
    <div
      className={cn("flex min-w-0 flex-col", className)}
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${title} screenshots`}
    >
      {/* ── Primary screenshot ─────────────────────────────────────────── */}
      <div className="group/frame relative">
        {/* §15: a *very* subtle burgundy bloom behind the frame — never a neon
            halo. It comes before the frame in DOM order and both are
            positioned, so it paints underneath without a negative z-index,
            which would have dropped it behind the page shell's background. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 -bottom-6 top-6 blur-[46px]"
          style={{
            background:
              "radial-gradient(60% 60% at 70% 25%, color-mix(in srgb, var(--primary) 55%, transparent) 0%, transparent 75%)",
          }}
        />

        <div
          className={cn(
            "relative overflow-hidden rounded-[18px] bg-[#0E0C0C] p-[6px]",
            "border shadow-[0_30px_70px_-40px_rgba(0,0,0,0.95)]",
            "transition-transform duration-500 ease-out",
            // §26 — the screenshot lifts a hair under the pointer.
            reduce ? "" : "group-hover/frame:scale-[1.01]",
          )}
          style={{ borderColor: BORDER_FRAME }}
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-[#0B0A0A]">
            {active && !broken[index] ? (
              /* Crossfade, not `mode="wait"`: with a wait the incoming image
                 only mounts once the outgoing one has finished exiting, so an
                 exit that is interrupted (two quick clicks) or never runs
                 leaves the frame showing the previous screenshot while the
                 strip has already moved on. Overlapping both is also the
                 softer swap. */
              <AnimatePresence initial={false}>
                <motion.div
                  key={active.url}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_EDITORIAL }}
                  className="absolute inset-0"
                >
                  <Image
                    src={active.url}
                    alt={altFor(active, index)}
                    fill
                    // The right column is a little over half of a 1600px shell.
                    sizes="(max-width: 1024px) 94vw, 56vw"
                    // Contain, so a screenshot is never cropped or stretched.
                    className="object-contain"
                    priority={index === 0}
                    onError={() =>
                      setBroken((current) => ({ ...current, [index]: true }))
                    }
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <PlaceholderFrame />
            )}
          </div>
        </div>
      </div>

      {/* ── Thumbnails · controls · dots ───────────────────────────────── */}
      {hasStrip && (
        <div className="mt-[clamp(14px,1.8vh,22px)] flex items-start gap-4">
          <ul
            className={cn(
              "flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1",
              "snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          >
            {images.map((image, position) => {
              const isActive = position === index;

              return (
                <li
                  key={image.url}
                  className="w-[calc(25%-0.5625rem)] min-w-[104px] shrink-0 snap-start"
                >
                  <button
                    type="button"
                    onClick={() => select(position)}
                    aria-label={`Show screenshot ${position + 1} of ${count}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "ring-brand relative block w-full overflow-hidden rounded-[10px]",
                      "aspect-[16/9] border border-(--edge) bg-[#0E0C0C]",
                      "transition-colors duration-300",
                      // The edge is a custom property rather than an inline
                      // `border-color`, so the hover utility can still win.
                      !isActive && "hover:border-[rgba(248,241,231,0.32)]",
                    )}
                    style={
                      {
                        "--edge": isActive ? ACCENT_BORDER : BORDER_SUBTLE,
                      } as React.CSSProperties
                    }
                  >
                    <Image
                      src={image.url}
                      alt=""
                      aria-hidden
                      fill
                      sizes="180px"
                      loading="lazy"
                      className={cn(
                        "object-cover object-top transition-opacity duration-300",
                        isActive ? "opacity-100" : "opacity-60 hover:opacity-85",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 flex-col items-center gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <GalleryButton label="Previous screenshot" onClick={() => step(-1)}>
                <ChevronLeft aria-hidden className="h-4 w-4" strokeWidth={2} />
              </GalleryButton>
              <GalleryButton label="Next screenshot" onClick={() => step(1)}>
                <ChevronRight aria-hidden className="h-4 w-4" strokeWidth={2} />
              </GalleryButton>
            </div>

            <div className="flex items-center gap-1.5">
              {images.map((image, position) => (
                <button
                  key={`dot-${image.url}`}
                  type="button"
                  onClick={() => select(position)}
                  aria-label={`Go to screenshot ${position + 1}`}
                  aria-current={position === index ? "true" : undefined}
                  className="ring-brand flex h-3.5 w-3.5 items-center justify-center rounded-full"
                >
                  <span
                    aria-hidden
                    className="block h-1.5 w-1.5 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        position === index
                          ? ACCENT_BORDER
                          : "rgba(248,241,231,0.22)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screen-reader narration for a swap that is otherwise purely visual. */}
      {hasStrip && (
        <p aria-live="polite" className="sr-only">
          {`Screenshot ${index + 1} of ${count}`}
        </p>
      )}
    </div>
  );
}

function GalleryButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "ring-brand flex h-9 w-9 items-center justify-center rounded-full",
        // Class, not inline style — otherwise the hover state can't win.
        "border border-[rgba(248,241,231,0.10)] text-[rgba(248,241,231,0.72)]",
        "transition-colors duration-300",
        "hover:border-transparent hover:bg-primary hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

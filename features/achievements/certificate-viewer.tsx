"use client";

/**
 * Phase 7 — the certificate viewer.
 *
 * A custom gallery viewer rather than a dialog component: the point of the
 * section is that these are physical objects on a wall, and a panel with a
 * title bar and an OK button would undo that in one step. So the certificate
 * keeps its frame, the room goes dark around it, and the metadata sits
 * underneath the way a placard does.
 *
 * Behaviour worth knowing about:
 *
 *   · Portalled to `document.body`. The section that opens it sets `isolate`
 *     and `overflow-hidden`, and a later section could otherwise paint over a
 *     fixed overlay nested inside it.
 *   · Escape closes; ← / → walk the wall without leaving the viewer. Focus
 *     moves to the close button on open and returns to the frame that opened
 *     it on close, and Tab is kept inside the overlay while it is up.
 *   · Scroll is locked on `documentElement` and the overlay carries
 *     `data-lenis-prevent`, so Lenis (the site's smooth scroller) does not
 *     keep driving the page underneath a wheel gesture over the certificate.
 *   · The frame is sized by whichever runs out first, width or height:
 *     `min(1100px, 92vw, (100vh - chrome) * √2)`. That is what stops a
 *     1100px-wide certificate from running off the bottom of a laptop screen.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIssued } from "@/features/achievements/constants";
import { CertificateFrame } from "@/features/achievements/certificate-frame";
import type { Achievement } from "@/features/achievements/data";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Vertical room the placard, the controls and the padding need. */
const CHROME = "250px";

export interface CertificateViewerProps {
  achievement: Achievement | null;
  holder: string;
  /** Position in the wall, for the "03 / 06" counter. */
  position: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/* -------------------------------------------------------------------------- */
/* Scroll lock                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Locks the page while the viewer is up. The scrollbar's width is added back
 * as padding, otherwise removing it shifts the whole layout sideways behind
 * the overlay — visible at the moment the viewer fades in.
 */
function useScrollLock(active: boolean) {
  React.useEffect(() => {
    if (!active) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousPadding = root.style.paddingRight;
    const gutter = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;

    return () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPadding;
    };
  }, [active]);
}

/* -------------------------------------------------------------------------- */
/* Viewer                                                                     */
/* -------------------------------------------------------------------------- */

export function CertificateViewer({
  achievement,
  holder,
  position,
  total,
  onClose,
  onPrev,
  onNext,
}: CertificateViewerProps) {
  const reduce = useReducedMotion() ?? false;
  const [mounted, setMounted] = React.useState(false);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  /** The element that had focus before the viewer opened. */
  const restoreRef = React.useRef<HTMLElement | null>(null);

  const open = achievement !== null;

  React.useEffect(() => setMounted(true), []);
  useScrollLock(open);

  // Remember where focus came from, then put it on the close button — the one
  // control that is always present and always safe to activate.
  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // Keyboard: Escape closes, arrows walk the wall, Tab stays inside.
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft" && total > 1) {
        event.preventDefault();
        onPrev();
        return;
      }
      if (event.key === "ArrowRight" && total > 1) {
        event.preventDefault();
        onNext();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, total, onClose, onPrev, onNext]);

  if (!mounted) return null;

  const issued = achievement ? formatIssued(achievement.issued_on) : "";
  const titleId = "certificate-viewer-title";

  return createPortal(
    <AnimatePresence>
      {achievement && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={(event) => {
            // Only a click on the backdrop itself dismisses — not one that
            // started on the certificate and drifted.
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-y-auto px-[max(16px,4vw)] py-8"
          style={{ backgroundColor: "rgba(11,11,11,0.96)" }}
        >
          {/* The same wall, one room darker — the viewer is still the gallery. */}
          <span
            aria-hidden
            className="achv-plaster pointer-events-none absolute inset-0 opacity-[0.09]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(60% 45% at 50% 0%, rgba(255,206,142,0.10) 0%, transparent 70%)",
            }}
          />

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.36, ease: EASE }}
            onClick={(event) => event.stopPropagation()}
            className="relative z-10 flex w-full max-w-[1100px] flex-col items-center"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close certificate viewer"
              className={cn(
                "absolute -top-1 right-0 z-20 flex h-11 w-11 items-center justify-center rounded-full",
                "border border-border-light bg-background/70 text-foreground-muted backdrop-blur-sm",
                "transition-colors hover:border-primary/60 hover:text-foreground ring-brand",
                "sm:-top-2 sm:-right-2",
              )}
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>

            {/* The certificate, sized by whichever runs out first: the 1100px
                cap, the viewport width, or the height left after the placard. */}
            <div
              className="w-full"
              style={{
                width: `min(1100px, 92vw, calc((100vh - ${CHROME}) * 1.414))`,
              }}
            >
              <CertificateFrame
                achievement={achievement}
                holder={holder}
                sizes="(max-width: 768px) 92vw, min(1100px, 92vw)"
                priority
              />
            </div>

            {/* Placard ------------------------------------------------- */}
            <div
              className={cn(
                "mt-7 w-full",
                "border-t border-[rgba(248,241,231,0.16)] pt-6",
              )}
              style={{
                width: `min(1100px, 92vw, calc((100vh - ${CHROME}) * 1.414))`,
              }}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  {achievement.category && (
                    <p className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="h-px w-8 bg-primary"
                      />
                      <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
                        {achievement.category}
                      </span>
                    </p>
                  )}

                  <h3
                    id={titleId}
                    className="mt-3 max-w-[26ch] font-display uppercase leading-[1.02] tracking-[0.008em] text-foreground text-[clamp(1.4rem,3vw,2.15rem)]"
                  >
                    {achievement.title}
                  </h3>

                  {(achievement.issuer || issued) && (
                    <p className="mt-2.5 font-sans text-[14px] text-[rgba(248,241,231,0.65)]">
                      {achievement.issuer}
                      {achievement.issuer && issued && (
                        <span aria-hidden className="px-2 text-primary">
                          ·
                        </span>
                      )}
                      {issued}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {achievement.credential_url && (
                    <a
                      href={achievement.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6",
                        "font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-primary-foreground",
                        "transition-colors hover:bg-primary-hover ring-brand",
                      )}
                    >
                      View credential
                      <ArrowUpRight
                        aria-hidden
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={2.2}
                      />
                    </a>
                  )}

                  {total > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onPrev}
                        aria-label="Previous certificate"
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full border border-border-light",
                          "text-foreground-muted transition-colors hover:border-primary/60 hover:text-foreground ring-brand",
                        )}
                      >
                        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                      </button>

                      <span
                        className="min-w-[62px] text-center font-sans text-[12px] tabular-nums tracking-[0.14em] text-[rgba(248,241,231,0.5)]"
                        aria-hidden
                      >
                        {String(position + 1).padStart(2, "0")} /{" "}
                        {String(total).padStart(2, "0")}
                      </span>

                      <button
                        type="button"
                        onClick={onNext}
                        aria-label="Next certificate"
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-full border border-border-light",
                          "text-foreground-muted transition-colors hover:border-primary/60 hover:text-foreground ring-brand",
                        )}
                      >
                        <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

/**
 * Phase 7 — Achievements / Certificates (client layout + motion).
 *
 * This is the whole of `/achievements`, not a band on the home page: the wall
 * is the page, so the header carries the page's `<h1>` and a way back.
 *
 * The room is a photograph — `public/images/achievement-wall.png`, a dark
 * gallery wall under three pendant lamps — and it is *fixed to the viewport*
 * rather than scrolled with the section. You stand still and the wall stands
 * still; the certificates travel past it. That is why the header is centred
 * and symmetrical here where the rest of the site is left-ranged editorial:
 * the backdrop's three lamps are symmetrical, and text ranged left under them
 * reads as though it slid off the wall.
 *
 * A wall, not a grid of cards. Every other section on this site is built from
 * rows and panels; this one is built from *objects* — each certificate hangs
 * from a wire under its own picture light, throws a shadow onto the plaster,
 * and catches the light on its top edge. That is the whole idea of the page,
 * so the construction is physical rather than decorative:
 *
 *   pool      the wash the fixture puts on the wall, behind everything
 *   lamp      cord, shade, the lit rim of its mouth, the bulb, and its bloom
 *   cone      the light itself, narrow at the bulb and wide at the frame
 *   wires     two lines from a single nail down to the frame's top corners
 *   frame     the certificate (see `certificate-frame.tsx`)
 *   cast      the contact shadow where the frame meets the wall
 *   placard   the gallery caption
 *
 * All of the gradient/clip-path work lives in `achievements-wall.css`, keyed
 * to one custom property per card: `--lit`. Hover and keyboard focus raise it
 * and every lighting layer responds together, which is what keeps the effect
 * reading as a lamp rather than as six unrelated CSS transitions.
 *
 * Motion is Framer only — entrances, scroll-triggered, with the stagger capped
 * so a full wall never makes the last certificate wait. GSAP owns scroll-
 * *linked* choreography elsewhere on the site; nothing here is scrubbed.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/scroll-reveal";
import {
  formatIssued,
  splitHeadingAccent,
} from "@/features/achievements/constants";
import { CertificateFrame } from "@/features/achievements/certificate-frame";
import { CertificateViewer } from "@/features/achievements/certificate-viewer";
import type {
  Achievement,
  AchievementsSection,
} from "@/features/achievements/data";
import "./achievements-wall.css";

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Burgundy pulled toward cream — the same back-link tint `/projects` uses. */
const ACCENT_TINT = "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

/**
 * The heading's accent words.
 *
 * Everywhere else on the site the accent is `var(--primary)` flat, because it
 * is sitting on Deep Black. Here it sits on a photograph of a brown-black
 * wall, and #5b0f18 against that is barely a colour — the line reads as a
 * smudge rather than as a second half of the sentence. Pulling a fifth of the
 * way to cream restores the separation without turning the burgundy pink.
 */
const HEADING_ACCENT =
  "color-mix(in srgb, var(--primary-hover) 90%, var(--foreground))";

/**
 * Certificates enter in sequence, but the delay stops accumulating after the
 * eighth — a twelve-certificate wall should not take a second and a half to
 * finish arriving.
 */
const STAGGER = 0.05;
const MAX_STAGGER_STEPS = 7;

/** Only the first row is above the fold; the rest lazy-load their scans. */
const EAGER_COUNT = 4;

/* -------------------------------------------------------------------------- */
/* The room                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The backdrop, pinned to the viewport for the whole length of the page.
 *
 * It is `fixed` rather than a background image on the section because a
 * scrolling photograph of a room would read as a very tall room; a fixed one
 * reads as *the* room, with the certificates moving through it. The layers,
 * bottom to top: the photograph, a burgundy/black grade that pulls its warmth
 * back toward the site palette, the plaster grain, and a vignette.
 *
 * `priority` is right here even though this is decoration — it is the largest
 * paint on the route, and lazy-loading it would show a flat black rectangle
 * for the first moment of every visit.
 *
 * The footer that follows this section carries its own opaque `bg-background`,
 * which is what stops the fixed room from showing through underneath it.
 */
function ShowcaseRoom() {
  return (
    <div
      aria-hidden
      className="achv-room pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="achv-room-shot">
        <Image
          src="/images/achievement-wall.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="achv-room-img"
        />
      </div>

      <div className="achv-room-grade absolute inset-0" />
      <div className="achv-plaster absolute inset-0" />
      <div className="achv-vignette absolute inset-0" />
    </div>
  );
}

/**
 * The room going out as the page leaves it.
 *
 * The room is fixed, the footer is not, so without this the footer's top edge
 * slices the pendants in half on the way past — a hard horizontal cut across
 * three lamps, which reads as a rendering fault rather than as a room ending.
 *
 * This is a *scrolling* element anchored to the foot of the section, so it
 * climbs the viewport as the footer approaches and blacks the room out from
 * the bottom up. It sits at `z-1`: above the room, below the content, so the
 * last row of certificates keeps its own light instead of dimming with the
 * wall behind it.
 */
function RoomFadeOut() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-screen"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, transparent 0%, rgba(11,11,11,0.5) 58%, var(--background) 88%)",
      }}
    />
  );
}

/**
 * The picture light over one certificate. Six elements, because each one is a
 * different physical thing: the cord it hangs from, the metal shade, the lit
 * rim of the shade's mouth, the bulb inside it, and the bloom the bulb puts
 * into the air. Every warm layer is scaled by `--lit`, so they brighten as
 * one — see `achievements-wall.css`.
 */
function PictureLight() {
  return (
    <div aria-hidden className="achv-lamp">
      <span className="achv-cord" />
      <span className="achv-shade">
        <span className="achv-shade-lip" />
      </span>
      {/* Bulb and bloom are siblings of the shade, not children: `clip-path`
          clips descendants, so nested inside they would be cut off at the
          mouth and never spill below it. */}
      <span className="achv-bulb" />
      <span className="achv-bloom" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

function BackToHome() {
  return (
    <Link
      href="/#home"
      className={cn(
        "group/back ring-brand inline-flex items-center gap-2 rounded-sm",
        "font-sans text-[13.5px] font-medium transition-colors hover:text-foreground",
        // On a phone the room's photograph is scaled up and its left-hand
        // pendant throws right where this link sits, so it needs a shadow to
        // hold its edge against lit plaster rather than flat black.
        "[text-shadow:0_1px_12px_rgba(0,0,0,0.9)]",
      )}
      style={{ color: ACCENT_TINT }}
    >
      <ArrowLeft
        aria-hidden
        className="h-4 w-4 transition-transform duration-300 ease-out group-hover/back:-translate-x-1"
        strokeWidth={2}
      />
      Back to Home
    </Link>
  );
}

/**
 * An empty table means the admin cleared the wall on purpose (see `data.ts`).
 * As a band on the home page that meant rendering nothing at all; as a page of
 * its own it has to say something, or the route is a blank screen.
 */
function EmptyState() {
  return (
    <div
      className={cn(
        "mt-14 rounded-[20px] border border-dashed border-[rgba(248,241,231,0.18)]",
        "px-8 py-16 text-center",
      )}
    >
      <p className="font-display text-[clamp(1.4rem,3vw,2rem)] uppercase text-foreground">
        Nothing on the wall yet
      </p>
      <p className="mt-3 font-sans text-[14.5px] leading-[1.7] text-foreground-muted">
        Certificates go up here as they are earned.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* One hung certificate                                                       */
/* -------------------------------------------------------------------------- */

function HungCertificate({
  achievement,
  holder,
  position,
  onOpen,
}: {
  achievement: Achievement;
  holder: string;
  position: number;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const issued = formatIssued(achievement.issued_on);

  return (
    <motion.li
      initial={{ opacity: 0, y: reduce ? 0 : 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduce ? 0.3 : 0.6,
        delay: reduce ? 0 : Math.min(position, MAX_STAGGER_STEPS) * STAGGER,
        ease: EASE,
      }}
    >
      {/* The object is a div, not a button: a frame contains a heading and
          block elements, none of which are legal inside <button>. The control
          is a transparent overlay on top instead, which also gives the whole
          card — frame and placard — as one hit target. Hover and keyboard
          focus are read off this wrapper via `:focus-within` in the CSS. */}
      <div className="achv-card group">
        {/* --------- The light on the wall, behind the object ---------
            Both layers start at the mouth of the shade rather than at the top
            of the card, so the throw is anchored to the bulb wherever the
            fixture's clamped height lands it. */}
        <span
          aria-hidden
          className="achv-pool pointer-events-none absolute inset-x-[-12%] -top-2 bottom-[16%] -z-10"
        />
        <span
          aria-hidden
          className={cn(
            "achv-cone pointer-events-none absolute left-1/2 -z-10",
            "top-[clamp(26px,3vw,38px)] h-[62%] w-[94%] -translate-x-1/2",
          )}
        />

        {/* --------- The fixture --------- */}
        <PictureLight />

        {/* --------- The hanging wire ---------
            Two lines from one nail to the frame's top corners. The SVG is
            stretched with `preserveAspectRatio="none"` so the geometry follows
            the card at any width; `vector-effect` keeps the stroke a hairline
            regardless of how far it is stretched. The nail is a real element
            rather than a <circle>, which that same stretch would flatten. */}
        <div aria-hidden className="relative h-[26px] w-full">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <line
              x1="50"
              y1="8"
              x2="7"
              y2="100"
              className="achv-wire"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="50"
              y1="8"
              x2="93"
              y2="100"
              className="achv-wire"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span className="achv-nail absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 rounded-full" />
        </div>

        {/* --------- The certificate --------- */}
        <div className="relative">
          <span
            aria-hidden
            className="achv-cast pointer-events-none absolute inset-x-[7%] -bottom-2 -z-10 h-5"
          />
          <CertificateFrame
            achievement={achievement}
            holder={holder}
            sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, (max-width: 1536px) 30vw, 22vw"
            priority={position < EAGER_COUNT}
          />
        </div>

        {/* --------- The placard --------- */}
        <div className="mt-[18px] text-center">
          <span className="block font-sans text-[11.5px] font-medium uppercase leading-[1.45] tracking-[0.14em] text-[rgba(248,241,231,0.8)] transition-colors duration-500 group-hover:text-foreground">
            {achievement.title}
          </span>

          {(achievement.issuer || issued) && (
            <span className="mt-[7px] block font-sans text-[10.5px] uppercase tracking-[0.16em] text-[rgba(248,241,231,0.38)] transition-colors duration-500 group-hover:text-[rgba(248,241,231,0.6)]">
              {achievement.issuer}
              {achievement.issuer && issued && (
                <span aria-hidden className="px-1.5 text-primary">
                  ·
                </span>
              )}
              {issued}
            </span>
          )}
        </div>

        {/* The control. Transparent, covers the whole object, and carries the
            only focus ring — the frame itself is inert to assistive tech. */}
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-20 cursor-pointer rounded-sm outline-none ring-brand"
        >
          <span className="sr-only">
            View the {achievement.title} certificate at full size
          </span>
        </button>
      </div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export interface AchievementsGalleryProps {
  section: AchievementsSection;
  achievements: Achievement[];
  /** Whose wall this is — alt text and the typeset plate's "awarded to". */
  holder: string;
  /** Numbered eyebrow, in site order — Services is "06", this is "07". */
  index?: string;
}

export function AchievementsGallery({
  section,
  achievements,
  holder,
  index = "07",
}: AchievementsGalleryProps) {
  /** Index of the certificate in the viewer; -1 when it is closed. */
  const [openIndex, setOpenIndex] = React.useState(-1);

  const total = achievements.length;

  const step = React.useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === -1 ? current : (current + delta + total) % total,
      );
    },
    [total],
  );

  const headingParts = splitHeadingAccent(
    section.heading,
    section.heading_accent,
  );

  // One line of provenance under the heading, the way `/projects` counts its
  // archive. Categories are only worth naming once there is more than one.
  const categories = new Set(
    achievements.map((achievement) => achievement.category.trim()).filter(Boolean),
  ).size;

  const summary = [
    `${total} ${total === 1 ? "certificate" : "certificates"}`,
    categories > 1 ? `${categories} categories` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      id="achievements"
      aria-labelledby="achievements-heading"
      className={cn(
        // `overflow-x-clip` keeps the wall pools, which bleed past the edge of
        // the outermost column, from opening a horizontal scrollbar on narrow
        // screens. It does not touch the room: a `fixed` element's containing
        // block is the viewport, so no ancestor's overflow clips it.
        "relative isolate min-h-screen overflow-x-clip",
        // Clears the fixed 80px navbar, then runs down to the footer. The top
        // padding is deep because the first screen is the showcase view: the
        // back link sits in the dark band under the navbar and the title has
        // to land *below* the photograph's pendants, in the light they throw.
        "pb-[clamp(90px,11vw,150px)] pt-[clamp(96px,12vh,132px)]",
      )}
    >
      <ShowcaseRoom />
      <RoomFadeOut />

      <div className={cn(CONTAINER, "relative z-10")}>
        <Reveal amount={0.4} distance={14}>
          <BackToHome />
        </Reveal>

        {/* ---------------- Heading ----------------
            Centred, unlike every other section on the site: it is standing
            under the middle of three lamps, and the wash behind it guarantees
            the contrast the photograph only happens to provide. */}
        <header className="relative mx-auto mt-[clamp(78px,11vh,142px)] max-w-[780px] text-center">
          <span
            aria-hidden
            className="achv-header-wash pointer-events-none absolute inset-x-[-30%] top-[-38%] -z-10 h-[190%]"
          />

          {/* The eyebrow lands inside the throw of the middle pendant, which
              is the brightest patch of wall on the page — so it is set in
              cream over a dark shadow rather than in burgundy, which the
              light would otherwise wash out to nothing. */}
          <Reveal amount={0.5} distance={16} delay={0.05}>
            <p className="flex items-center justify-center gap-3 sm:gap-4">
              <span
                aria-hidden
                className="h-px w-8 bg-[rgba(248,241,231,0.28)] sm:w-12"
              />
              <span className="font-display text-[13px] leading-none text-[rgba(248,241,231,0.55)]">
                {index}
              </span>
              <span
                className={cn(
                  "font-sans text-[11.5px] font-semibold uppercase tracking-[0.18em] sm:text-[13px]",
                  "text-[rgba(248,241,231,0.92)] [text-shadow:0_1px_10px_rgba(0,0,0,0.85)]",
                )}
              >
                {section.eyebrow}
              </span>
              <span
                aria-hidden
                className="h-px w-8 bg-[rgba(248,241,231,0.28)] sm:w-12"
              />
            </p>
          </Reveal>

          <Reveal amount={0.4} distance={24} delay={0.1}>
            <h1
              id="achievements-heading"
              className={cn(
                "mx-auto mt-6 max-w-[15ch] font-display uppercase text-foreground",
                "text-[clamp(2.1rem,7.2vw,4.6rem)] leading-[0.94] tracking-[0.008em]",
                // The warm key the photograph's lamps would put on raised
                // letters, so the title sits in the room rather than over it.
                "[text-shadow:0_1px_0_rgba(255,214,158,0.18),0_18px_44px_rgba(0,0,0,0.65)]",
              )}
            >
              {headingParts.map((part, partIndex) => (
                <span
                  key={partIndex}
                  style={
                    part.accented ? { color: HEADING_ACCENT } : undefined
                  }
                >
                  {part.text}
                </span>
              ))}
            </h1>
          </Reveal>

          {section.standfirst && (
            <Reveal amount={0.4} distance={18} delay={0.16}>
              <p
                className={cn(
                  "mx-auto mt-6 max-w-[54ch] font-sans text-[15px] leading-[1.75]",
                  "text-[rgba(248,241,231,0.68)] sm:mt-7 sm:text-[17px]",
                )}
              >
                {section.standfirst}
              </p>
            </Reveal>
          )}

          {total > 0 && (
            <Reveal amount={0.4} distance={12} delay={0.2}>
              <p className="mt-8 font-sans text-[11.5px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle sm:text-[12px]">
                {summary}
              </p>
            </Reveal>
          )}
        </header>

        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* A hairline at hanging height, the way a gallery marks its datum. */}
            <div
              aria-hidden
              className="achv-datum mt-[clamp(56px,10vh,104px)] h-px w-full"
            />

            {/* ---------------- The wall of certificates ----------------
                The vertical gap is wide enough that a lamp never throws onto
                the placard of the certificate above it: each row has to read
                as its own lit object. */}
            <ul
              className={cn(
                "mx-auto mt-[clamp(34px,4vw,52px)] grid w-full max-w-[1240px]",
                "grid-cols-1 gap-x-[clamp(24px,3vw,44px)] gap-y-[clamp(52px,5.4vw,74px)]",
                "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
              )}
            >
              {achievements.map((achievement, position) => (
                <HungCertificate
                  key={achievement.id}
                  achievement={achievement}
                  holder={holder}
                  position={position}
                  onOpen={() => setOpenIndex(position)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <CertificateViewer
        achievement={openIndex === -1 ? null : achievements[openIndex]}
        holder={holder}
        position={openIndex === -1 ? 0 : openIndex}
        total={total}
        onClose={() => setOpenIndex(-1)}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
    </section>
  );
}

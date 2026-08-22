"use client";

/**
 * Phase 6 — Services (client layout + motion).
 *
 * Deliberately *not* a grid of cards. The two sections either side of this one
 * already spend their whole budget on boxes — the Projects stack and the
 * Career timeline cards — and Design_System.md §31 is explicit: don't put
 * every piece of information inside a card. So the offers render as an
 * editorial index instead: hairline-separated rows, an ordinal in the margin,
 * the title set in Brunson, and what you actually get listed alongside it.
 *
 * The three columns (title · summary · deliverables) collapse to one stack
 * below `lg`, where the ordinal moves inline above the title.
 *
 * Motion is per row and scroll-triggered, so a long list doesn't accumulate
 * delay, and hover is the only continuous effect — a burgundy wash and a rule
 * that draws across the row, matching the career card's foot.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { RollingText } from "@/components/motion/rolling-text";
import { Reveal, ScrollRule } from "@/components/motion/scroll-reveal";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import { formatOrdinal } from "@/features/services/constants";
import { getServiceIcon } from "@/features/services/icons";
import type { Service, ServicesSection } from "@/features/services/data";

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/* -------------------------------------------------------------------------- */
/* One offer                                                                  */
/* -------------------------------------------------------------------------- */

function ServiceRow({ service, position }: { service: Service; position: number }) {
  const Icon = getServiceIcon(service.icon_name);
  const ordinal = formatOrdinal(position);

  return (
    <li className="border-t border-border">
      <Reveal amount={0.15} distance={20}>
        <article
          data-fx="row"
          className={cn(
            "group relative isolate grid gap-x-8 gap-y-4 px-1 py-8 sm:py-10",
            "lg:grid-cols-12 lg:gap-x-10 lg:py-12",
          )}
        >
          {/* Burgundy wash that fades up on hover — one accent, per §4. */}
          <span
            aria-hidden
            className="glow-radial pointer-events-none absolute -inset-x-4 -inset-y-px -z-10 rounded-[20px] opacity-0 transition-opacity duration-500 group-hover:opacity-45"
          />

          {/* ---------------- Ordinal + title ---------------- */}
          <div data-lane className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="font-display text-[13px] leading-none text-primary">
                {ordinal}
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border border-border-light",
                  "text-foreground-subtle transition-colors duration-500",
                  "group-hover:border-primary/45 group-hover:text-foreground",
                )}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.6} />
              </span>
            </div>

            <h3
              className={cn(
                "mt-4 max-w-[16ch] font-display uppercase text-foreground",
                "text-[clamp(1.5rem,2.6vw,2.15rem)] leading-[1.02] tracking-[0.008em]",
              )}
            >
              {service.title}
            </h3>
          </div>

          {/* ---------------- Summary ---------------- */}
          {service.summary && (
            <p
              data-lane
              className="max-w-[52ch] font-sans text-[15px] leading-[1.75] text-foreground-muted lg:col-span-3"
            >
              {service.summary}
            </p>
          )}

          {/* ---------------- Deliverables ---------------- */}
          {service.deliverables.length > 0 && (
            <ul
              data-lane
              className={cn(
                "flex flex-col gap-2.5",
                service.summary ? "lg:col-span-5" : "lg:col-span-8",
              )}
            >
              {service.deliverables.map((item, index) => (
                <li
                  key={index}
                  className="flex gap-3 font-sans text-[14px] leading-[1.6] text-foreground-subtle"
                >
                  <span
                    aria-hidden
                    className="mt-[9px] h-px w-3.5 shrink-0 bg-primary/70"
                  />
                  <span className="max-w-[48ch]">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Hairline that draws across the row on hover. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-primary/60",
              "transition-transform duration-700 group-hover:scale-x-100",
            )}
          />
        </article>
      </Reveal>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export interface ServicesContentProps {
  section: ServicesSection;
  services: Service[];
  /** Numbered eyebrow — the timeline is "05", so Services is "06". */
  index?: string;
}

export function ServicesSectionContent({
  section,
  services,
  index = "06",
}: ServicesContentProps) {
  // Nothing to show — render nothing rather than an empty chapter. An empty
  // table means the admin cleared it on purpose (see data.ts).
  if (services.length === 0) return null;

  const ctaLabel = section.cta_label.trim();

  return (
    <section
      id="services"
      className="relative isolate overflow-hidden bg-background py-[clamp(80px,10vw,150px)]"
    >
      {/* Scroll effect 05 — each row's three columns travel at their own rate. */}
      <SectionScrollFx effect="column-lanes" refreshKey={services.length} />

      {/* Atmosphere — one burgundy glow and the film grain from §14. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-[10%] top-[18%] h-[460px] w-[460px] rounded-full bg-primary/[0.08] blur-[170px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-overlay" />
      </div>

      <div className={cn(CONTAINER, "relative z-10")}>
        <Reveal amount={0.6} distance={16}>
          <p className="flex items-center gap-4">
            <span className="font-display text-[13px] leading-none text-primary">
              {index}
            </span>
            <span className="h-px w-10 bg-primary/60" />
            <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground-subtle">
              {section.eyebrow}
            </span>
          </p>
        </Reveal>

        <div className="mt-8 grid gap-x-6 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <RollingText
              as="h2"
              text={section.heading}
              amount={0.4}
              className={cn(
                "font-display uppercase text-foreground",
                "text-[clamp(2.4rem,5.2vw,3.9rem)] leading-[0.98] tracking-[0.008em]",
              )}
            />
          </div>

          {section.standfirst && (
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <p className="max-w-[46ch] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.7] text-foreground-subtle">
                  {section.standfirst}
                </p>
              </Reveal>
            </div>
          )}
        </div>

        <ScrollRule className="mt-10" />

        <ol className="mt-6">
          {services.map((service, position) => (
            <ServiceRow
              key={service.id}
              service={service}
              position={position}
            />
          ))}
        </ol>

        {ctaLabel && (
          <div className="mt-12 border-t border-border pt-10">
            <Reveal amount={0.5} distance={14}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                {section.cta_note && (
                  <p className="max-w-[38ch] font-sans text-[15px] leading-[1.7] text-foreground-muted">
                    {section.cta_note}
                  </p>
                )}

                <Link
                  href={section.cta_href || "#contact"}
                  className={cn(
                    "group inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-primary px-7",
                    "font-sans text-[14px] font-semibold uppercase tracking-[0.1em] text-primary-foreground",
                    "transition-colors duration-300 hover:bg-primary-hover ring-brand",
                  )}
                >
                  {ctaLabel}
                  <ArrowUpRight
                    aria-hidden
                    className="h-[18px] w-[18px] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                    strokeWidth={2.2}
                  />
                </Link>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}

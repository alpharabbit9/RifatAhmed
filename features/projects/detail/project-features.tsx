"use client";

/**
 * KEY FEATURES — the middle information column (§19).
 *
 * Compact rows, not cards: a small burgundy icon square, the feature name and
 * one line under it. The reference keeps these tight so the column reads as a
 * list at a glance; anything with a border around each item turns the section
 * into a dashboard.
 *
 * A Client Component only for the staggered entrance. Icons arrive as string
 * keys (functions can't cross the RSC boundary) and resolve here — a literal
 * Lucide component is accepted too, which is what the admin preview passes.
 */

import { cn } from "@/lib/utils";
import { CaseStudyHeading } from "@/features/projects/detail/headings";
import { RiseItem, RiseList } from "@/features/projects/detail/motion";
import { ACCENT_TINT, ACCENT_WASH } from "@/features/projects/detail/tokens";
import { getFeatureIcon } from "@/features/projects/icons";
import type { ShowcaseFeature } from "@/features/projects/types";

export function ProjectFeatures({
  features,
  className,
}: {
  features: ShowcaseFeature[];
  className?: string;
}) {
  if (features.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="key-features">
      <CaseStudyHeading className="mb-[clamp(18px,2vw,26px)]" as="h2">
        <span id="key-features">Key Features</span>
      </CaseStudyHeading>

      <RiseList className="flex flex-col gap-[clamp(14px,1.6vw,20px)]" delay={0.1}>
        {features.map(({ icon, title, description }) => {
          const Icon = typeof icon === "string" ? getFeatureIcon(icon) : icon;

          return (
            <RiseItem key={title} className="flex min-w-0 items-start gap-3.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                style={{ backgroundColor: ACCENT_WASH }}
              >
                <Icon
                  aria-hidden
                  className="h-[17px] w-[17px]"
                  strokeWidth={1.6}
                  style={{ color: ACCENT_TINT }}
                />
              </span>

              <div className="min-w-0 pt-0.5">
                <h3 className="font-sans text-[14.5px] font-semibold leading-[1.3] text-foreground">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 font-sans text-[13px] leading-[1.5] text-[rgba(248,241,231,0.60)]">
                    {description}
                  </p>
                )}
              </div>
            </RiseItem>
          );
        })}
      </RiseList>
    </section>
  );
}

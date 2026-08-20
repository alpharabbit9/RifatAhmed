/**
 * PROJECT HIGHLIGHTS — the numbers under the tech stack (§21).
 *
 * Small bordered rectangles: burgundy icon, the figure, its label. Not the
 * design system's `<StatCard>` — that one sets its value in Brunson, which the
 * global display rule uppercases ("2.3s" → "2.3S"), and sits on `--surface`
 * where the reference wants the page's own black.
 *
 * Icons are string keys resolved here; the section disappears entirely when a
 * project has no numbers worth showing.
 */

import { cn } from "@/lib/utils";
import { CaseStudyHeading } from "@/features/projects/detail/headings";
import { ACCENT_TINT } from "@/features/projects/detail/tokens";
import { getFeatureIcon } from "@/features/projects/icons";
import type { ProjectHighlight } from "@/features/projects/types";

export function ProjectHighlights({
  highlights,
  className,
}: {
  highlights: ProjectHighlight[];
  className?: string;
}) {
  if (highlights.length === 0) return null;

  return (
    <section
      className={cn("min-w-0", className)}
      aria-labelledby="project-highlights"
    >
      <CaseStudyHeading className="mb-[clamp(16px,1.8vw,22px)]" as="h2">
        <span id="project-highlights">Project Highlights</span>
      </CaseStudyHeading>

      {/* Two up on a phone, one row per three from `sm` — the cards stay
          compact rather than stretching to fill a wide column. */}
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {highlights.map(({ icon, value, label }) => {
          const Icon = typeof icon === "string" ? getFeatureIcon(icon) : icon;

          return (
            <li
              key={`${value}-${label}`}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5",
                "border border-[rgba(248,241,231,0.14)] bg-background",
              )}
            >
              <Icon
                aria-hidden
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={1.6}
                style={{ color: ACCENT_TINT }}
              />
              <div className="min-w-0 leading-tight">
                <p className="font-sans text-[17px] font-semibold text-foreground">
                  {value}
                </p>
                {label && (
                  <p className="mt-0.5 font-sans text-[11.5px] text-[rgba(248,241,231,0.55)]">
                    {label}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

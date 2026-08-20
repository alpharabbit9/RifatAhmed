/**
 * CHALLENGE / SOLUTION / IMPACT — the closing panel (§22, §23).
 *
 * One wide burgundy-tinted block, three dividered columns, each an icon, a
 * tracked-out heading and a paragraph. The tint is `rgba(91,15,24,0.10)` over
 * the page's black: present enough to separate the block from everything above
 * it, nowhere near a red slab.
 *
 * Any of the three may be empty — the panel drops that column, and disappears
 * entirely when all three are.
 */

import { AlertCircle, Lightbulb, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCENT_TINT,
  ACCENT_WASH,
  BORDER_SUBTLE,
} from "@/features/projects/detail/tokens";
import type { CaseStudyProject } from "@/features/projects/types";

interface Chapter {
  key: string;
  icon: LucideIcon;
  heading: string;
  body: string;
}

export function ProjectStory({
  project,
  className,
}: {
  project: CaseStudyProject;
  className?: string;
}) {
  const chapters: Chapter[] = [
    {
      key: "challenge",
      icon: AlertCircle,
      heading: "Challenge",
      body: project.challenge,
    },
    {
      key: "solution",
      icon: Lightbulb,
      heading: "Solution",
      body: project.solution,
    },
    { key: "impact", icon: TrendingUp, heading: "Impact", body: project.impact },
  ].filter((chapter) => chapter.body.trim().length > 0);

  if (chapters.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-[16px] border p-[clamp(22px,2.6vw,38px)]",
        className,
      )}
      style={{
        backgroundColor: "rgba(91, 15, 24, 0.10)",
        borderColor: "rgba(248, 241, 231, 0.12)",
      }}
      aria-label="Challenge, solution and impact"
    >
      <div
        className={cn(
          "grid gap-[clamp(24px,2.6vw,40px)]",
          chapters.length === 3
            ? "md:grid-cols-3"
            : chapters.length === 2
              ? "md:grid-cols-2"
              : "md:grid-cols-1",
        )}
      >
        {chapters.map(({ key, icon: Icon, heading, body }, position) => (
          <article
            key={key}
            className={cn(
              "min-w-0",
              position > 0 && "md:border-l md:pl-[clamp(24px,2.6vw,40px)]",
            )}
            style={position > 0 ? { borderColor: BORDER_SUBTLE } : undefined}
          >
            <div className="flex items-center gap-3">
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
              <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.16em] text-foreground">
                {heading}
              </h2>
            </div>

            <p className="mt-4 font-sans text-[13.5px] leading-[1.75] text-[rgba(248,241,231,0.62)]">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

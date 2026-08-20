/**
 * TECH STACK — the third information column (§20).
 *
 * Deliberately one treatment for every label: deep-black tag, hairline cream
 * border, cream text, burgundy on hover. Colouring each technology in its own
 * brand turns the column into confetti; the card on the home page already
 * carries the brand marks for anyone who wants them.
 */

import { cn } from "@/lib/utils";
import { CaseStudyHeading } from "@/features/projects/detail/headings";

export function ProjectTechStack({
  technologies,
  className,
}: {
  technologies: string[];
  className?: string;
}) {
  if (technologies.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="tech-stack">
      <CaseStudyHeading className="mb-[clamp(18px,2vw,26px)]" as="h2">
        <span id="tech-stack">Tech Stack</span>
      </CaseStudyHeading>

      <ul className="flex flex-wrap gap-2">
        {technologies.map((label) => (
          <li key={label}>
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-[8px] px-3",
                "border border-[rgba(248,241,231,0.16)] bg-background",
                "font-sans text-[12.5px] font-medium text-[rgba(248,241,231,0.86)]",
                "transition-colors duration-300",
                "hover:border-[color-mix(in_srgb,var(--primary)_72%,var(--foreground))]",
                "hover:bg-[rgba(91,15,24,0.18)] hover:text-foreground",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * ABOUT THE PROJECT — the first of the three information columns (§18).
 *
 * `project.about` is an array of paragraphs, so the copy keeps its editorial
 * rhythm without any markup in the database. No paragraphs, no column.
 */

import { CaseStudyHeading } from "@/features/projects/detail/headings";
import { cn } from "@/lib/utils";

export function ProjectAbout({
  paragraphs,
  className,
}: {
  paragraphs: string[];
  className?: string;
}) {
  if (paragraphs.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="about-project">
      <CaseStudyHeading className="mb-[clamp(18px,2vw,26px)]" as="h2">
        <span id="about-project">About the Project</span>
      </CaseStudyHeading>

      <div className="flex flex-col gap-5">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.slice(0, 48)}
            className="font-sans text-[14.5px] leading-[1.75] text-[rgba(248,241,231,0.66)]"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

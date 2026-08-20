/**
 * 404 for a slug with no project — same framed shell as the case study, so a
 * mistyped or retired URL still lands somewhere that looks like the site.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ACCENT_TINT, BORDER_FRAME } from "@/features/projects/detail/tokens";

export default function ProjectNotFound() {
  return (
    <main className="min-h-screen bg-background p-2.5 sm:p-3.5 lg:p-4">
      <div
        className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1600px] flex-col items-start justify-center rounded-[20px] border px-[clamp(20px,6vw,96px)] py-16"
        style={{ borderColor: BORDER_FRAME }}
      >
        <p
          className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: ACCENT_TINT }}
        >
          404 — Not found
        </p>

        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] text-foreground">
          No project lives here
        </h1>

        <p className="mt-6 max-w-[46ch] font-sans text-[16px] leading-[1.6] text-[rgba(248,241,231,0.66)]">
          The case study you were looking for has either moved or was never
          published. The rest of the work is still on the home page.
        </p>

        <Link
          href="/#projects"
          className="group/back ring-brand mt-10 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 font-sans text-[13.5px] font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary-hover"
        >
          <ArrowLeft
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 group-hover/back:-translate-x-1"
            strokeWidth={2}
          />
          Back to Projects
        </Link>
      </div>
    </main>
  );
}

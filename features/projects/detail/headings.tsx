/**
 * The tracked-out uppercase heading every block on the case study opens with —
 * ABOUT THE PROJECT, KEY FEATURES, TECH STACK, PROJECT HIGHLIGHTS.
 *
 * Not the global `.label-overline` utility: that one is `--foreground-subtle`
 * (a caption grey), and these are structural headings that need to sit at
 * near-cream against the black (§17/§18).
 */

import { cn } from "@/lib/utils";

export function CaseStudyHeading({
  children,
  className,
  as: Component = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <Component
      className={cn(
        "font-sans text-[12px] font-semibold uppercase tracking-[0.16em]",
        "text-[rgba(248,241,231,0.92)]",
        className,
      )}
    >
      {children}
    </Component>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "featured" | "soft" | "outline";

const tones: Record<BadgeTone, string> = {
  // "FEATURED PROJECT" — burgundy wash with a burgundy dot
  featured:
    "bg-accent-soft text-foreground tracking-[0.14em] uppercase text-[0.72rem]",
  soft: "bg-accent-soft text-foreground-muted",
  outline: "border border-border text-foreground-muted",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Show the leading burgundy dot (as on the FEATURED PROJECT pill). */
  dot?: boolean;
}

export function Badge({
  className,
  tone = "featured",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-sans font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
}

/** Tech-stack chip — "Next.js", "TypeScript", "Tailwind CSS"… (Design_System.md §21) */
export function TechPill({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-[rgba(91,15,24,0.16)] px-3 py-1.5",
        "text-sm font-medium text-foreground-muted border border-[rgba(91,15,24,0.45)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

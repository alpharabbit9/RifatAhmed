import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The tracked-out uppercase section heading used throughout the page
 * ("ABOUT THE PROJECT", "KEY FEATURES", "TECH STACK", "PROJECT HIGHLIGHTS").
 *
 * Set `accent` to render it in burgundy (as with "AI-POWERED RESUME BUILDER").
 */
export interface SectionLabelProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  accent?: boolean;
}

export function SectionLabel({
  className,
  accent = false,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        "font-sans font-semibold uppercase tracking-[0.18em] text-xs",
        accent ? "text-primary" : "text-foreground-subtle",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/** A short burgundy rule — the little divider under hero subheads. */
export function AccentRule({ className }: { className?: string }) {
  return <span className={cn("block h-0.5 w-10 bg-primary", className)} />;
}

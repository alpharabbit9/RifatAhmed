import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold " +
  "whitespace-nowrap transition-all duration-150 ring-brand " +
  "disabled:opacity-50 disabled:pointer-events-none";

/**
 * `btn-sweep` (see `styles/globals.css`) replaces the flat background
 * cross-fade with a fill that wipes in from the left edge. `--sweep` is the
 * colour it wipes in; the variant's own `background-color` stays as the
 * resting state underneath.
 */
const variants: Record<ButtonVariant, string> = {
  // Solid burgundy CTA — "VIEW MY WORK →"
  primary:
    "btn-sweep bg-primary text-primary-foreground [--sweep:var(--primary-hover)] hover:-translate-y-0.5 rounded-full",
  // Transparent / outlined — low-emphasis actions
  secondary:
    "btn-sweep bg-transparent text-foreground border border-border-light [--sweep:rgba(248,241,231,0.08)] hover:border-foreground/35 rounded-full",
  // Text-only, no border
  ghost: "bg-transparent text-foreground-muted hover:text-foreground rounded-md",
  // Circular icon button — a directional wipe reads as noise on a 48px
  // circle, so this one keeps the plain colour swap.
  icon: "bg-surface-elevated text-foreground hover:bg-accent-soft hover:text-primary rounded-full aspect-square p-0",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const sizeClass = variant === "icon" ? "h-12 w-12" : sizes[size];
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizeClass, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

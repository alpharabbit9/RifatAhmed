import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The core dark surface — a deep-black panel with a soft border and
 * editorial radius, matching project cards and content blocks.
 *
 * `glow` adds the burgundy radial wash seen behind hero/feature panels.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  glow?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[18px] border border-border shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        elevated ? "bg-surface-elevated" : "bg-surface",
        glow && "glow-radial",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

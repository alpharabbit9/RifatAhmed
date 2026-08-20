import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The metric tile from "PROJECT HIGHLIGHTS" — a value, a label, and an
 * optional leading icon in a burgundy-tinted square.
 *
 * ```tsx
 * <StatCard value="20+" label="Projects" icon={<Users />} />
 * <StatCard value="3+" label="Years Learning" />
 * ```
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function StatCard({
  className,
  value,
  label,
  icon,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-surface p-4",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-primary">
          {icon}
        </span>
      )}
      <div className="leading-tight">
        <div className="font-display text-2xl text-foreground">{value}</div>
        <div className="text-xs text-foreground-subtle">{label}</div>
      </div>
    </div>
  );
}

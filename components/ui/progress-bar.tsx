import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A labeled strength meter — a label + a percentage on one row, with a
 * burgundy fill underneath.
 *
 * ```tsx
 * <ProgressBar label="Skills Match" value={90} />
 * ```
 */
export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  /** 0–100 */
  value: number;
  showValue?: boolean;
}

export function ProgressBar({
  className,
  label,
  value,
  showValue = true,
  ...props
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm text-foreground">{label}</span>}
          {showValue && (
            <span className="text-sm text-foreground-muted tabular-nums">
              {pct}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

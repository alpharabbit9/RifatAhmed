import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A sidebar navigation row (Overview / Projects / Skills…). The active row
 * gets the burgundy-soft fill and cream text.
 *
 * Renders a <button> by default; wrap your own <Link> around it, or restyle
 * via className.
 */
export interface NavItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  active?: boolean;
}

export const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
  ({ className, icon, active = false, children, ...props }, ref) => (
    <button
      ref={ref}
      data-active={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        "transition-colors ring-brand",
        active
          ? "bg-accent-soft text-foreground"
          : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center",
            active ? "text-primary" : "text-foreground-muted",
          )}
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  ),
);
NavItem.displayName = "NavItem";

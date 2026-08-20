"use client";

/**
 * Shared chrome for the Projects admin screens.
 *
 * Same visual language as the About editor (`app/admin/(dashboard)/about/`) —
 * the class strings are duplicated rather than imported because that file
 * keeps them private and is owned by another phase; copying five constants is
 * cheaper than reaching across a section boundary.
 */

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const inputClass =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary placeholder:text-foreground-subtle/50";

export const textareaClass =
  "w-full rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-primary placeholder:text-foreground-subtle/50";

export const labelClass = "text-[12px] font-medium text-foreground-subtle";

export const hintClass = "text-[12px] text-foreground-subtle/70";

export const primaryButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50";

export const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-30 disabled:hover:border-border-light";

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[18px] border border-border bg-surface p-6", className)}>
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm text-foreground-subtle">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ErrorBanner({ error }: { error: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          role="alert"
          className="overflow-hidden text-sm text-primary"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}

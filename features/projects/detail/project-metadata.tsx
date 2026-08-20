/**
 * The metadata row under the hero copy — YEAR · ROLE · LIVE DEMO · SOURCE CODE.
 *
 * Each item is a small burgundy icon, an uppercase label and the value below
 * it, with hairline dividers between (§14). Entirely conditional: a project
 * with no live demo or no repository simply has fewer columns — never a
 * disabled link or an em-dash placeholder.
 *
 * A Server Component. The only interactivity is the hover on the two links,
 * which is CSS.
 */

import { ArrowUpRight, Calendar, Github, Layers, Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ACCENT_TINT, BORDER_SUBTLE } from "@/features/projects/detail/tokens";
import type { CaseStudyProject } from "@/features/projects/types";

/** `https://github.com/x/y/` → `github.com/x/y` — the label, not the href. */
function prettyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/**
 * The same label, with a `<wbr>` after every dot and slash.
 *
 * A URL is one long unbroken token, so without break opportunities it either
 * forces the metadata row wider than its column or snaps mid-word
 * ("careerlogicai.vercel.ap | p"). Breaking after the separators is how the
 * reference wraps them, and these are the hints that let it.
 */
function breakableUrl(url: string): React.ReactNode {
  // Keeps the separators — `split` on a capturing group returns them too.
  const parts = prettyUrl(url).split(/([./])/);

  return parts.map((part, position) =>
    part === "." || part === "/" ? (
      <React.Fragment key={position}>
        {part}
        <wbr />
      </React.Fragment>
    ) : (
      <React.Fragment key={position}>{part}</React.Fragment>
    ),
  );
}

function ItemShell({
  icon: Icon,
  label,
  children,
  divided,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  divided: boolean;
}) {
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-2",
        "sm:pr-[clamp(14px,1.5vw,26px)]",
        divided && "sm:border-l sm:pl-[clamp(14px,1.5vw,26px)]",
      )}
      style={divided ? { borderColor: BORDER_SUBTLE } : undefined}
    >
      <Icon
        aria-hidden
        className="h-[18px] w-[18px]"
        strokeWidth={1.5}
        style={{ color: ACCENT_TINT }}
      />
      <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[rgba(248,241,231,0.88)]">
        {label}
      </span>
      {children}
    </li>
  );
}

const valueClass =
  "font-sans text-[12.5px] leading-[1.5] text-[rgba(248,241,231,0.62)]";

function ExternalValue({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — opens in a new tab`}
      className={cn(
        valueClass,
        "group/link ring-brand inline-flex max-w-[22ch] items-start gap-1 rounded-sm",
        "transition-colors hover:text-foreground",
      )}
    >
      <span className="min-w-0 break-words">{breakableUrl(href)}</span>
      <ArrowUpRight
        aria-hidden
        className="mt-[3px] h-3 w-3 shrink-0 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
        strokeWidth={2}
      />
    </a>
  );
}

export function ProjectMetadata({
  project,
  className,
}: {
  project: CaseStudyProject;
  className?: string;
}) {
  const items: React.ReactNode[] = [];

  if (project.year) {
    items.push(
      <ItemShell key="year" icon={Calendar} label="Year" divided={false}>
        <span className={valueClass}>{project.year}</span>
      </ItemShell>,
    );
  }

  if (project.role) {
    items.push(
      <ItemShell key="role" icon={Layers} label="Role" divided={items.length > 0}>
        <span className={valueClass}>{project.role}</span>
      </ItemShell>,
    );
  }

  if (project.liveDemo) {
    items.push(
      <ItemShell
        key="live"
        icon={Link2}
        label="Live Demo"
        divided={items.length > 0}
      >
        <ExternalValue
          href={project.liveDemo}
          label={`Open the live ${project.title} demo`}
        />
      </ItemShell>,
    );
  }

  if (project.sourceCode) {
    items.push(
      <ItemShell
        key="source"
        icon={Github}
        label="Source Code"
        divided={items.length > 0}
      >
        <ExternalValue
          href={project.sourceCode}
          label={`View the ${project.title} source code`}
        />
      </ItemShell>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn("border-t pt-[clamp(20px,2.2vw,30px)]", className)}
      style={{ borderColor: BORDER_SUBTLE }}
    >
      {/* Two columns while stacked, one dividered row from `sm` up. */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-7 sm:flex sm:flex-nowrap sm:gap-x-0 sm:gap-y-0">
        {items}
      </ul>
    </div>
  );
}

/**
 * A single tech-stack entry: brand mark + name.
 *
 * Labels come from free-text admin input, so not every one has a brand mark —
 * "RAG", "REST APIs" and "AI Agents" are concepts, not products. Those fall
 * back to a Lucide glyph chosen by keyword, and anything unrecognised gets a
 * neutral dot, so a pill is never left with an empty slot where an icon
 * should be.
 *
 * At rest every mark is monochrome and inherits the pill's text colour, which
 * is what keeps a row of eight from turning into confetti against the
 * editorial palette. The real brand colour only appears on hover, driven by
 * the `--brand` custom property set per pill.
 */

import {
  Bot,
  Boxes,
  Braces,
  Database,
  Network,
  Search,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTechLogo, normaliseTechKey } from "@/features/about/tech-logos";

/** Concept labels with no brand mark, matched on the normalised key. */
const CONCEPT_ICONS: Record<string, LucideIcon> = {
  restapis: Network,
  restapi: Network,
  rest: Network,
  graphql: Network,
  aiagents: Bot,
  aiagent: Bot,
  agents: Bot,
  rag: Search,
  vectordatabases: Database,
  vectordatabase: Database,
  vectordb: Database,
  zustand: Boxes,
  redux: Boxes,
  automation: Workflow,
  workflowautomation: Workflow,
};

export function TechPill({
  label,
  delayMs = 0,
}: {
  label: string;
  /** Staggers the hover cascade across a row. */
  delayMs?: number;
}) {
  const logo = getTechLogo(label);
  const ConceptIcon = logo ? null : CONCEPT_ICONS[normaliseTechKey(label)];

  return (
    <span
      style={{
        transitionDelay: `${delayMs}ms`,
        ...(logo ? ({ "--brand": logo.color } as React.CSSProperties) : {}),
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5",
        "border-[rgba(91,15,24,0.45)] bg-[rgba(91,15,24,0.16)]",
        "font-sans text-[13px] font-medium text-foreground-muted",
        "transition-[color,background-color,border-color] duration-300",
        "group-hover:border-[rgba(91,15,24,0.85)] group-hover:bg-[rgba(91,15,24,0.28)] group-hover:text-foreground",
      )}
    >
      {logo ? (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn(
            "h-[15px] w-[15px] shrink-0",
            // `fill: currentColor` at rest, brand colour on hover — the
            // transition is on `fill`, so the mark warms up rather than
            // snapping.
            "fill-current transition-[fill] duration-300",
            "group-hover:fill-[var(--brand)]",
          )}
        >
          <path d={logo.path} />
        </svg>
      ) : ConceptIcon ? (
        <ConceptIcon
          aria-hidden
          className="h-[15px] w-[15px] shrink-0"
          strokeWidth={1.75}
        />
      ) : (
        <Braces aria-hidden className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
      )}
      {label}
    </span>
  );
}

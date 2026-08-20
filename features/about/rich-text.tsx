/**
 * The tiny slice of Markdown the About body supports: `**bold**` becomes a
 * highlighted span, blank lines separate paragraphs. Nothing else is parsed.
 *
 * Deliberately not `dangerouslySetInnerHTML` — the string is split and
 * rendered as React nodes, so admin-authored copy can never inject markup.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/** Splits on blank lines; collapses stray whitespace-only paragraphs. */
export function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Splits on newlines — used for the stacked display heading. */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const BOLD = /\*\*([^*]+)\*\*/g;

export interface RichTextProps {
  text: string;
  className?: string;
  /** Classes for the `**highlighted**` runs. */
  highlightClassName?: string;
}

/** Renders one paragraph's worth of text with `**bold**` runs highlighted. */
export function RichText({
  text,
  className,
  highlightClassName,
}: RichTextProps) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(BOLD)) {
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    nodes.push(
      <strong
        key={`${start}-${match[1]}`}
        className={cn(
          "font-medium text-foreground decoration-primary/70 decoration-2 underline-offset-[6px] [text-decoration-line:underline]",
          highlightClassName,
        )}
      >
        {match[1]}
      </strong>,
    );

    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <span className={className}>{nodes}</span>;
}

/**
 * Lucide icons available to skill groups (Design_System.md §23 — minimal,
 * rounded, monochrome).
 *
 * An allow-list rather than a free-text icon name: the admin picks from this
 * set, so a typo can never render a blank square on the public site.
 */

import {
  Blocks,
  Bot,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Server,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const SKILL_ICONS = {
  layers: Layers,
  code: Code2,
  blocks: Blocks,
  database: Database,
  server: Server,
  cloud: Cloud,
  sparkles: Sparkles,
  brain: BrainCircuit,
  bot: Bot,
  workflow: Workflow,
  cpu: Cpu,
  terminal: Terminal,
  branch: GitBranch,
  zap: Zap,
} satisfies Record<string, LucideIcon>;

export type SkillIconName = keyof typeof SKILL_ICONS;

export const SKILL_ICON_NAMES = Object.keys(SKILL_ICONS) as SkillIconName[];

export function isSkillIconName(value: string): value is SkillIconName {
  return value in SKILL_ICONS;
}

/** Never throws — an unknown name degrades to the neutral default. */
export function getSkillIcon(name: string | null | undefined): LucideIcon {
  return name && isSkillIconName(name) ? SKILL_ICONS[name] : Sparkles;
}

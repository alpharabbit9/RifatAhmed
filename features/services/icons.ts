/**
 * Lucide icons a service can use (Design_System.md §23 — minimal, rounded,
 * monochrome, stroked).
 *
 * Same allow-list pattern as `features/about/icons.ts` and
 * `features/projects/icons.ts`: the admin picks a key, the key is what the
 * database stores, and the component is resolved at render time. A free-text
 * icon name would let a typo render an empty square on the public site — and
 * the icon *components* can't cross the RSC boundary anyway.
 */

import {
  Blocks,
  Bot,
  BrainCircuit,
  Cloud,
  Code2,
  Compass,
  Database,
  Gauge,
  LayoutDashboard,
  MessagesSquare,
  Palette,
  PlugZap,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const SERVICE_ICONS = {
  code: Code2,
  blocks: Blocks,
  palette: Palette,
  dashboard: LayoutDashboard,
  mobile: Smartphone,
  server: Server,
  database: Database,
  cloud: Cloud,
  plug: PlugZap,
  bot: Bot,
  brain: BrainCircuit,
  message: MessagesSquare,
  workflow: Workflow,
  search: Search,
  shield: ShieldCheck,
  gauge: Gauge,
  compass: Compass,
  wrench: Wrench,
  rocket: Rocket,
  sparkles: Sparkles,
} satisfies Record<string, LucideIcon>;

export type ServiceIconName = keyof typeof SERVICE_ICONS;

export const SERVICE_ICON_NAMES = Object.keys(
  SERVICE_ICONS,
) as ServiceIconName[];

export function isServiceIconName(value: string): value is ServiceIconName {
  return value in SERVICE_ICONS;
}

/** Never throws — an unknown key degrades to the neutral default. */
export function getServiceIcon(name: string | null | undefined): LucideIcon {
  return name && isServiceIconName(name) ? SERVICE_ICONS[name] : Sparkles;
}

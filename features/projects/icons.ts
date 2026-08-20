/**
 * Lucide icons a project feature can use (Design_System.md §23 — minimal,
 * rounded, monochrome, stroked).
 *
 * Same shape as `features/about/icons.ts`: an allow-list rather than free
 * text, so the admin picks a key and a typo can never render an empty square
 * on the public card. Stored in `projects.features[].icon` as the key string
 * and resolved back to a component at render time.
 */

import {
  Bot,
  BrainCircuit,
  ChartNoAxesColumn,
  Cloud,
  Code2,
  Database,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  MessagesSquare,
  Mic,
  Network,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const FEATURE_ICONS = {
  brain: BrainCircuit,
  sparkles: Sparkles,
  bot: Bot,
  workflow: Workflow,
  search: Search,
  file: FileText,
  download: Download,
  upload: Upload,
  database: Database,
  chart: ChartNoAxesColumn,
  shield: ShieldCheck,
  lock: Lock,
  zap: Zap,
  code: Code2,
  cloud: Cloud,
  globe: Globe,
  network: Network,
  dashboard: LayoutDashboard,
  message: MessagesSquare,
  mic: Mic,
  image: ImageIcon,
  users: Users,
  target: Target,
  rocket: Rocket,
} satisfies Record<string, LucideIcon>;

export type FeatureIconName = keyof typeof FEATURE_ICONS;

export const FEATURE_ICON_NAMES = Object.keys(
  FEATURE_ICONS,
) as FeatureIconName[];

export function isFeatureIconName(value: string): value is FeatureIconName {
  return value in FEATURE_ICONS;
}

/** Never throws — an unknown key degrades to the neutral default. */
export function getFeatureIcon(name: string | null | undefined): LucideIcon {
  return name && isFeatureIconName(name) ? FEATURE_ICONS[name] : Sparkles;
}

/**
 * Platform → glyph for the hero's social row.
 *
 * The links themselves come from `social_links`, the table the Footer phase
 * owns, so the hero and the footer can never disagree about where "GitHub"
 * points. The map is duplicated here rather than imported from
 * `features/footer/footer-content.tsx` because that file keeps it private and
 * is owned by another phase — copying a lookup table is cheaper than reaching
 * across a section boundary and editing a file a parallel session may hold.
 */

import {
  Dribbble,
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  dribbble: Dribbble,
  email: Mail,
  mail: Mail,
  website: Globe,
  portfolio: Globe,
};

/**
 * Platform names are freeform admin input, so match loosely on a normalized
 * key and fall back to a generic globe rather than dropping the link.
 */
export function socialIconFor(platform: string): LucideIcon {
  const key = platform.toLowerCase().replace(/[^a-z]/g, "");
  return PLATFORM_ICONS[key] ?? Globe;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Layers,
  Mail,
  Milestone,
  PanelBottom,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Every admin screen from PLAN.md, in site order.
 *
 * `built: false` renders the item greyed out and unclickable so the roadmap
 * stays visible without producing 404s. When you build a section, flip its
 * flag to `true` — that's the only change this file needs.
 */
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  built: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, built: true },
  { href: "/admin/hero", label: "Hero", icon: UserRound, built: true },
  // Tech Stack is edited on the About screen — the two render as one section.
  {
    href: "/admin/about",
    label: "About & Tech Stack",
    icon: FileText,
    built: true,
  },
  { href: "/admin/tech-stack", label: "Tech Stack", icon: Layers, built: false },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, built: true },
  {
    href: "/admin/career-journey",
    label: "Career Journey",
    icon: Milestone,
    built: true,
  },
  { href: "/admin/services", label: "Services", icon: Briefcase, built: true },
  {
    href: "/admin/achievements",
    label: "Achievements",
    icon: Award,
    built: true,
  },
  // Site order: the Contact section sits between Achievements and the footer.
  // "Contact" is the details people reach you on; "Messages" is the inbox the
  // form fills.
  { href: "/admin/contact", label: "Contact", icon: Mail, built: true },
  { href: "/admin/messages", label: "Messages", icon: Inbox, built: true },
  { href: "/admin/footer", label: "Footer", icon: PanelBottom, built: true },
];

function isActive(pathname: string, href: string) {
  // "/admin" must match exactly, or it would light up on every child route.
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminNavLinks({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className={cn(
        // Mobile: a horizontal scroller under the header.
        "flex gap-1 overflow-x-auto border-b border-border p-3",
        // Desktop: a sticky sidebar column.
        "lg:sticky lg:top-0 lg:h-[calc(100vh-65px)] lg:w-[232px] lg:shrink-0",
        "lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4",
      )}
    >
      <p className="label-overline hidden px-3 pb-2 lg:block">Sections</p>

      {NAV_ITEMS.map(({ href, label, icon: Icon, built }) => {
        const active = isActive(pathname, href);
        const showBadge = href === "/admin/messages" && unreadCount > 0;

        if (!built) {
          return (
            <span
              key={href}
              title="Not built yet"
              aria-disabled="true"
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground-subtle/45"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ring-brand",
              active
                ? "text-foreground"
                : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="admin-nav-active"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-lg bg-accent-soft"
              />
            )}

            <Icon
              className={cn(
                "relative h-4 w-4 shrink-0 transition-colors",
                active ? "text-primary" : "text-foreground-subtle",
              )}
            />
            <span className="relative whitespace-nowrap">{label}</span>

            {showBadge && (
              <span
                className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

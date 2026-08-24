"use client";

/**
 * Phase 8 — Footer presentation + motion.
 *
 * Data comes from `footer-section.tsx` (the Server Component shell); this
 * file owns layout and the scroll-triggered animation only.
 */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Dribbble,
  Facebook,
  FileText,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialLink } from "@/features/footer/data";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollMarquee,
} from "@/components/motion/scroll-reveal";
import { SectionScrollFx } from "@/components/motion/gsap/section-scroll-fx";
import { scrollToTop } from "@/components/motion/smooth-scroll";

/**
 * Mirrors the navbar (`components/ui/notch-navbar.tsx`), and for the same
 * reason its hrefs are absolute: the footer renders on `/projects` and
 * `/achievements` as well, where a bare `#about` would look for a section on
 * the page it is already on and find nothing.
 */
const NAV_LINKS = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/#about" },
  { label: "Projects", href: "/projects" },
  { label: "Experience", href: "/#experience" },
  { label: "Achievements", href: "/achievements" },
  { label: "Contact", href: "/#contact" },
];

/**
 * Platform names are freeform admin input, so match loosely on a normalized
 * key and fall back to a generic globe rather than dropping the link.
 */
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

function iconFor(platform: string): LucideIcon {
  const key = platform.toLowerCase().replace(/[^a-z]/g, "");
  return PLATFORM_ICONS[key] ?? Globe;
}

/* -------------------------------------------------------------------------- */
/* Column heading                                                             */
/* -------------------------------------------------------------------------- */

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Back to top                                                                */
/* -------------------------------------------------------------------------- */

function BackToTop() {
  const reduce = useReducedMotion() ?? false;

  function handleClick() {
    // Routed through Lenis — a native smooth scroll would fight its loop.
    scrollToTop({ immediate: reduce });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex items-center gap-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle transition-colors hover:text-primary ring-brand"
    >
      Back to top
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(248,241,231,0.18)] transition-colors group-hover:border-primary">
        <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

export interface FooterContentProps {
  socials: SocialLink[];
  resumeUrl: string | null;
  email: string;
  name: string;
  tagline: string;
}

export function FooterContent({
  socials,
  resumeUrl,
  email,
  name,
  tagline,
}: FooterContentProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer"
      className="relative isolate overflow-hidden border-t border-border-light bg-background"
    >
      {/* Ambient burgundy wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-full h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/[0.10] blur-[150px]" />
        <div className="bg-grain absolute inset-0 opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Scroll effect 07 — the columns rise as the page lands on them. */}
      <SectionScrollFx effect="footer-rise" />

      {/* Scroll-linked outline marquee — drifts only while the page moves */}
      <div
        aria-hidden
        data-fx="counter"
        className="relative z-10 select-none pt-[clamp(48px,7vw,88px)]"
      >
        <ScrollMarquee distance={-18}>
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="whitespace-nowrap pr-10 font-display text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] text-transparent [-webkit-text-stroke:1px_rgba(248,241,231,0.13)]"
            >
              {name} <span className="text-primary/25">&bull;</span>{" "}
            </span>
          ))}
        </ScrollMarquee>
      </div>

      <div className="relative z-10 px-[clamp(24px,7.5vw,110px)] pb-10 pt-[clamp(40px,5vw,72px)]">
        <div data-fx="rise" className="grid gap-[clamp(36px,4vw,64px)] md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
          {/* Brand ---------------------------------------------------------- */}
          <Reveal amount={0.2}>
            <p className="font-display text-[2rem] leading-[0.95] text-foreground">
              {name}
            </p>
            <p className="mt-4 max-w-[300px] font-sans text-[14px] leading-[1.65] text-[rgba(248,241,231,0.7)]">
              {tagline}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-5 inline-flex items-center gap-2 font-sans text-[14px] text-foreground-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {email}
            </a>
          </Reveal>

          {/* Explore -------------------------------------------------------- */}
          <Reveal amount={0.2} delay={0.08}>
            <ColumnLabel>Explore</ColumnLabel>
            <RevealGroup
              stagger={0.06}
              delayChildren={0.12}
              className="mt-5 flex flex-col gap-3"
            >
              {NAV_LINKS.map((link) => (
                <RevealItem key={link.label} distance={14}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 font-sans text-[14px] text-[rgba(248,241,231,0.7)] transition-colors hover:text-foreground"
                  >
                    <span className="h-px w-0 bg-primary transition-all duration-200 group-hover:w-4" />
                    {link.label}
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </Reveal>

          {/* Connect -------------------------------------------------------- */}
          <Reveal amount={0.2} delay={0.16}>
            <ColumnLabel>Connect</ColumnLabel>

            {socials.length > 0 ? (
              <RevealGroup
                stagger={0.06}
                delayChildren={0.12}
                className="mt-5 flex flex-col gap-3"
              >
                {socials.map((social) => {
                  const Icon = iconFor(social.platform);
                  return (
                    <RevealItem key={social.id} distance={14}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2.5 font-sans text-[14px] text-[rgba(248,241,231,0.7)] transition-colors hover:text-foreground"
                      >
                        <Icon className="h-4 w-4 text-foreground-subtle transition-colors group-hover:text-primary" />
                        {social.platform}
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-0.5" />
                      </a>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            ) : (
              <p className="mt-5 max-w-[220px] font-sans text-[13px] leading-[1.6] text-foreground-subtle">
                Add social links in the admin panel and they&apos;ll appear
                here.
              </p>
            )}
          </Reveal>

          {/* Resume --------------------------------------------------------- */}
          <Reveal amount={0.2} delay={0.24}>
            <ColumnLabel>Resume</ColumnLabel>
            <p className="mt-5 max-w-[260px] font-sans text-[14px] leading-[1.65] text-[rgba(248,241,231,0.7)]">
              Prefer the one-page version? Grab the full CV.
            </p>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-sweep group mt-5 inline-flex h-12 items-stretch rounded-[4px] border border-foreground ring-brand [--sweep:var(--primary)]"
              >
                <span className="flex items-center gap-2 px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground">
                  <FileText className="h-4 w-4" />
                  Download CV
                </span>
                <span className="flex w-12 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors duration-300 group-hover:bg-primary-hover">
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            ) : (
              <p className="mt-5 font-sans text-[13px] text-foreground-subtle">
                Resume upload pending.
              </p>
            )}
          </Reveal>
        </div>

        {/* Bottom bar ------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={cn(
            "mt-[clamp(40px,5vw,72px)] flex flex-col items-start gap-5 border-t border-border-light pt-7",
            "sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p className="font-sans text-[12px] text-foreground-subtle">
            &copy; {year} {name}. All rights reserved.
          </p>
          <div className="flex items-center gap-7">
            <p className="hidden font-sans text-[12px] text-foreground-subtle sm:block">
              Built with Next.js &amp; Supabase
            </p>
            <BackToTop />
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

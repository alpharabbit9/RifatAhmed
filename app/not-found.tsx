/**
 * The 404, in the site's own clothes (PLAN.md phase 9).
 *
 * Worth building rather than leaving to the framework: `/projects/<slug>`
 * calls `notFound()` for any slug that has no published project, so this is a
 * page real visitors reach by following a stale link — and Next's built-in
 * fallback is a white page with a system font, which reads as "the site is
 * broken" rather than "that one page moved".
 *
 * Both exits are deliberate. Home is where most people meant to go; the
 * archive is where a dead `/projects/<slug>` link most likely belongs now.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { NotchNavbar } from "@/components/ui/notch-navbar";
import { Reveal } from "@/components/motion/scroll-reveal";
import { FooterSection } from "@/features/footer/footer-section";
import { SiteLogo } from "@/features/hero/site-logo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** Editorial container per Design_System.md §8. */
const CONTAINER =
  "mx-auto w-full max-w-[1440px] px-[max(20px,5vw)] xl:px-[60px]";

/** Burgundy pulled toward cream — the shared link tint. */
const ACCENT_TINT = "color-mix(in srgb, var(--primary) 60%, var(--foreground))";

export default function NotFound() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar logo={<SiteLogo />} />

        <section
          className={cn(
            CONTAINER,
            "flex min-h-screen flex-col justify-center",
            "pb-[clamp(80px,10vw,140px)] pt-[clamp(130px,15vh,190px)]",
          )}
        >
          <Reveal amount={0.4} distance={16}>
            <p className="flex items-center gap-4">
              <span className="font-display text-[13px] leading-none text-primary">
                404
              </span>
              <span aria-hidden className="h-px w-10 bg-primary" />
              <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle sm:text-[13px]">
                Dead End
              </span>
            </p>
          </Reveal>

          <Reveal amount={0.4} distance={24} delay={0.06}>
            <h1
              className={cn(
                "mt-6 max-w-[14ch] font-display uppercase text-foreground",
                "text-[clamp(2.5rem,6.4vw,4.9rem)] leading-[0.94] tracking-[0.008em]",
              )}
            >
              This page
              <span className="text-primary"> isn&rsquo;t </span>
              here.
            </h1>
          </Reveal>

          <Reveal amount={0.4} distance={18} delay={0.12}>
            <p className="mt-6 max-w-[520px] font-sans text-[16px] leading-[1.72] text-[rgba(248,241,231,0.65)] sm:text-[17px]">
              The link may be out of date, or the work behind it was taken down.
              Everything still standing is one of these two doors.
            </p>
          </Reveal>

          <Reveal amount={0.4} distance={14} delay={0.18}>
            <div className="mt-10 flex flex-wrap items-center gap-x-9 gap-y-4">
              <Link
                href="/#home"
                className={cn(
                  "group/back ring-brand inline-flex items-center gap-2 rounded-sm",
                  "font-sans text-[13.5px] font-medium transition-colors hover:text-foreground",
                )}
                style={{ color: ACCENT_TINT }}
              >
                <ArrowLeft
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover/back:-translate-x-1"
                  strokeWidth={2}
                />
                Back to Home
              </Link>

              <Link
                href="/projects"
                className={cn(
                  "group/arch ring-brand inline-flex items-center gap-2 rounded-sm",
                  "font-sans text-[13.5px] font-medium text-foreground-muted",
                  "transition-colors hover:text-foreground",
                )}
              >
                Browse the project archive
                <ArrowUpRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover/arch:translate-x-1 group-hover/arch:-translate-y-1"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <FooterSection />
    </>
  );
}

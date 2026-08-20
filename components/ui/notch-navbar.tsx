"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = {
  left: [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Projects", href: "#projects" },
  ],
  right: [
    { label: "Experience", href: "#experience" },
    { label: "Contact", href: "#contact" },
  ],
};

const BORDER = "rgba(248, 241, 231, 0.14)";

function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center whitespace-nowrap font-sans text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors",
        active
          ? "text-foreground"
          : "text-[rgba(248,241,231,0.65)] hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-2 left-0 h-[2px] bg-primary transition-all duration-200",
          active ? "w-full" : "w-0 group-hover:w-full",
        )}
      />
    </Link>
  );
}

export function NotchNavbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { logo?: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn("fixed inset-x-0 top-0 z-50 flex h-20 px-0", className)}
        {...props}
      >
        {/* Left side bar — flexible */}
        <div className="relative z-20 h-[52px] min-w-0 flex-1 bg-background">
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="51.5"
              x2="100%"
              y2="51.5"
              stroke={BORDER}
              strokeWidth={1}
            />
          </svg>
        </div>

        {/* Notch container */}
        <div className="relative z-10 -ml-px flex h-20 shrink-0">
          {/* Left corner */}
          <div className="relative h-full w-[56px] shrink-0">
            <div
              className="absolute inset-0 bg-background"
              style={{ clipPath: "path('M0 0 H56 V80 C28 80 28 52 0 52 Z')" }}
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 56 80"
            >
              <path
                d="M0 51.5 C28 51.5 28 79.5 56 79.5"
                fill="none"
                stroke={BORDER}
                strokeWidth={1}
              />
            </svg>
          </div>

          {/* Center content */}
          <div className="relative -ml-px h-full min-w-0 flex-1">
            <div className="absolute inset-0 bg-background">
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="79.5"
                  x2="100%"
                  y2="79.5"
                  stroke={BORDER}
                  strokeWidth={1}
                />
              </svg>
            </div>

            <div className="relative flex h-full w-full items-end justify-between px-5 pb-5 md:px-10">
              {/* Desktop left nav */}
              <nav className="mb-0.5 hidden shrink-0 gap-9 md:flex">
                {NAV_ITEMS.left.map((item) => (
                  <NavLink
                    key={item.label}
                    {...item}
                    active={item.label === "Home"}
                  />
                ))}
              </nav>

              {/* Mobile menu button */}
              <button
                className="mb-0.5 p-1 text-foreground-muted transition-colors hover:text-foreground md:hidden"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {/* Logo */}
              <div className="mx-2 mt-1 flex shrink-0 justify-center md:mx-5">
                {props.logo || (
                  <Link
                    href="#home"
                    className="group relative flex items-center justify-center"
                  >
                    <Image
                      src="/images/logo.png"
                      alt="Rifat Ahmed"
                      width={38}
                      height={38}
                      className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
                      priority
                    />
                  </Link>
                )}
              </div>

              {/* Desktop right nav */}
              <nav className="hidden shrink-0 items-center gap-9 md:flex">
                {NAV_ITEMS.right.map((item) => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              {/* Mobile spacer to balance the menu button */}
              <div className="mb-0.5 h-5 w-5 md:hidden" />
            </div>
          </div>

          {/* Right corner */}
          <div className="relative -ml-px h-full w-[56px] shrink-0">
            <div
              className="absolute inset-0 bg-background"
              style={{ clipPath: "path('M0 0 H56 V52 C28 52 28 80 0 80 Z')" }}
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 56 80"
            >
              <path
                d="M0 79.5 C28 79.5 28 51.5 56 51.5"
                fill="none"
                stroke={BORDER}
                strokeWidth={1}
              />
            </svg>
          </div>
        </div>

        {/* Right side bar — flexible */}
        <div className="relative z-20 -ml-px h-[52px] min-w-0 flex-1 bg-background">
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="51.5"
              x2="100%"
              y2="51.5"
              stroke={BORDER}
              strokeWidth={1}
            />
          </svg>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 border-b border-border-light bg-background p-4 shadow-lg md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {[...NAV_ITEMS.left, ...NAV_ITEMS.right].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg p-3 font-sans text-sm font-medium uppercase tracking-[0.08em] text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

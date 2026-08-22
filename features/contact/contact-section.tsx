"use client";

/**
 * Phase 7 — "Let's Work Together".
 *
 * The page's closing argument: oversized display type on the left, a working
 * contact form on the right. Motion is entirely scroll-triggered (see
 * components/motion/scroll-reveal) — nothing animates until the section is
 * actually on screen.
 */

import * as React from "react";
import { useActionState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Loader2, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitContactMessage } from "@/features/contact/actions";
import {
  CONTACT_INITIAL_STATE,
  type ContactFormState,
} from "@/features/contact/state";
import {
  EASE_EDITORIAL,
  MaskedLine,
  ParallaxLayer,
  Reveal,
  RevealGroup,
  RevealItem,
  ScrollRule,
} from "@/components/motion/scroll-reveal";
import { GsapWords } from "@/components/motion/gsap/gsap-words";

const DEFAULT_EMAIL = "hello@rifatahmed.dev";

/* -------------------------------------------------------------------------- */
/* Form field                                                                 */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email";
  textarea?: boolean;
  rows?: number;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

function Field({
  id,
  name,
  label,
  type = "text",
  textarea = false,
  rows = 5,
  autoComplete,
  placeholder,
  error,
  disabled,
}: FieldProps) {
  const shared = cn(
    "peer w-full resize-none border-0 border-b bg-transparent px-0 pb-3 pt-2",
    "font-sans text-[15px] text-foreground outline-none transition-colors duration-200",
    "placeholder:text-foreground-subtle/50",
    "disabled:opacity-50",
    error
      ? "border-b-primary"
      : "border-b-[rgba(248,241,231,0.16)] focus:border-b-primary",
  );

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle"
      >
        {label}
      </label>

      {textarea ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={shared}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(shared, "h-11")}
        />
      )}

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden pt-2 font-sans text-[13px] text-primary"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submit button — mirrors the hero's split CTA                               */
/* -------------------------------------------------------------------------- */

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "btn-sweep group mt-2 inline-flex h-14 w-full items-stretch rounded-[4px]",
        "border border-foreground transition-opacity ring-brand [--sweep:var(--primary)]",
        "disabled:opacity-60",
      )}
    >
      <span className="flex flex-1 items-center justify-center font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-foreground">
        {pending ? "Sending…" : "Send Message"}
      </span>
      <span className="flex w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-colors duration-300 group-hover:bg-primary-hover group-disabled:group-hover:bg-primary">
        {pending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        )}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Success panel                                                              */
/* -------------------------------------------------------------------------- */

function SuccessPanel({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -12 }}
      transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
      className="flex min-h-[420px] flex-col items-start justify-center"
    >
      <motion.span
        initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE_EDITORIAL }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary ring-1 ring-primary/40"
      >
        <Check className="h-6 w-6" />
      </motion.span>

      <p className="mt-6 font-display text-[2.4rem] leading-[1] text-foreground">
        Message
        <br />
        <span className="text-primary">Received.</span>
      </p>

      <p className="mt-4 max-w-[340px] font-sans text-[15px] leading-[1.6] text-foreground-muted">
        {message}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-7 font-sans text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground-subtle underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        Send another
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Direct-contact rows                                                        */
/* -------------------------------------------------------------------------- */

function DirectLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(248,241,231,0.18)] text-foreground-muted transition-colors group-hover:border-primary group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
          {label}
        </span>
        <span className="block truncate font-sans text-[15px] text-foreground transition-colors group-hover:text-primary">
          {value}
        </span>
      </span>
    </>
  );

  const className = "group flex items-center gap-4";

  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export interface ContactSectionProps {
  /** Overridable so a later phase can feed this from `profile` without edits. */
  email?: string;
  location?: string;
}

export function ContactSection({
  email = DEFAULT_EMAIL,
  location = "Dhaka, Bangladesh — working worldwide",
}: ContactSectionProps = {}) {
  const [state, formAction, isPending] = useActionState<
    ContactFormState,
    FormData
  >(submitContactMessage, CONTACT_INITIAL_STATE);

  // Lets "Send another" drop back to a blank form without a server round-trip.
  const [dismissedId, setDismissedId] = React.useState(0);
  const showSuccess =
    state.status === "success" && state.submissionId > dismissedId;

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-background py-[clamp(88px,12vh,160px)]"
    >
      {/* Background — scroll-linked burgundy wash + fine grain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <ParallaxLayer
          from={90}
          to={-90}
          className="absolute left-[-10%] top-[10%] h-[520px] w-[520px]"
        >
          <div className="h-full w-full rounded-full bg-primary/[0.10] blur-[150px]" />
        </ParallaxLayer>
        <ParallaxLayer
          from={-60}
          to={70}
          className="absolute right-[-8%] bottom-[4%] h-[420px] w-[420px]"
        >
          <div className="h-full w-full rounded-full bg-primary/[0.08] blur-[140px]" />
        </ParallaxLayer>
        <div className="bg-grain absolute inset-0 opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 px-[clamp(24px,7.5vw,110px)]">
        {/* Section header */}
        <Reveal className="flex items-center gap-4" amount={0.6}>
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-primary">
            07
          </span>
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-[rgba(248,241,231,0.65)]">
            Contact
          </span>
        </Reveal>

        <ScrollRule className="mt-5" />

        <div className="mt-[clamp(40px,6vw,80px)] grid gap-[clamp(48px,6vw,88px)] lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* ---------------------------------------------------------------- */}
          {/* Left — the pitch                                                  */}
          {/* ---------------------------------------------------------------- */}
          <div>
            <RevealGroup stagger={0.1} amount={0.35}>
              <h2 className="font-display text-[clamp(3.4rem,7.2vw,7.5rem)] leading-[0.85] text-foreground">
                <MaskedLine>Let&apos;s</MaskedLine>
                <MaskedLine>Work</MaskedLine>
                <MaskedLine className="text-primary">Together</MaskedLine>
              </h2>
            </RevealGroup>

            <Reveal delay={0.15} className="mt-8">
              {/* Scroll effect 06 — the pitch lights up a word at a time as
                  the paragraph crosses the viewport (GsapWords). Framer still
                  owns the block's entrance; GSAP only touches the words. */}
              <p className="max-w-[430px] border-l-2 border-primary/40 pl-4 font-sans text-[15px] leading-[1.65] text-[rgba(248,241,231,0.78)]">
                <GsapWords text="Have a product to build, a workflow to automate, or a role to fill? Tell me what you're working on — I read every message and reply personally, usually within a day." />
              </p>
            </Reveal>

            <RevealGroup
              stagger={0.09}
              delayChildren={0.2}
              className="mt-10 flex flex-col gap-6"
            >
              <RevealItem>
                <DirectLine
                  icon={Mail}
                  label="Email"
                  value={email}
                  href={`mailto:${email}`}
                />
              </RevealItem>
              <RevealItem>
                <DirectLine
                  icon={MapPin}
                  label="Based in"
                  value={location}
                />
              </RevealItem>
            </RevealGroup>

            <Reveal delay={0.25} className="mt-10">
              <span className="inline-flex items-center gap-2.5 rounded-full bg-accent-soft px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-primary/40 blur-[3px]" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  Available for freelance &amp; full-time
                </span>
              </span>
            </Reveal>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right — the form                                                  */}
          {/* ---------------------------------------------------------------- */}
          <Reveal distance={34} amount={0.2}>
            <div className="rounded-[18px] border border-border bg-surface/70 p-[clamp(24px,3vw,40px)] shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-sm">
              <AnimatePresence mode="wait" initial={false}>
                {showSuccess ? (
                  <SuccessPanel
                    message={state.message}
                    onReset={() => setDismissedId(state.submissionId)}
                  />
                ) : (
                  <motion.form
                    key="form"
                    action={formAction}
                    initial={false}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-7"
                    noValidate
                  >
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                      Start a conversation
                    </p>

                    <Field
                      id="contact-name"
                      name="name"
                      label="Your Name"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      error={state.fieldErrors.name}
                      disabled={isPending}
                    />

                    <Field
                      id="contact-email"
                      name="email"
                      label="Email Address"
                      type="email"
                      autoComplete="email"
                      placeholder="jane@company.com"
                      error={state.fieldErrors.email}
                      disabled={isPending}
                    />

                    <Field
                      id="contact-message"
                      name="message"
                      label="Message"
                      textarea
                      placeholder="Tell me about the project, timeline and budget…"
                      error={state.fieldErrors.message}
                      disabled={isPending}
                    />

                    {/* Honeypot — hidden from humans and assistive tech. */}
                    <div aria-hidden className="hidden">
                      <label htmlFor="contact-company">Company</label>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {state.status === "error" && state.message && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22 }}
                          role="alert"
                          className="font-sans text-[13px] text-primary"
                        >
                          {state.message}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <SubmitButton pending={isPending} />

                    <p className="font-sans text-[12px] leading-[1.5] text-foreground-subtle">
                      Prefer email? Reach me directly at{" "}
                      <a
                        href={`mailto:${email}`}
                        className="text-foreground-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
                      >
                        {email}
                      </a>
                      .
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

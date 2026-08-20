"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { SocialLink } from "@/features/footer/data";
import {
  createSocialLink,
  deleteResume,
  deleteSocialLink,
  moveSocialLink,
  updateSocialLink,
  uploadResume,
  type ActionResult,
} from "@/features/footer/actions";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const inputClass =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary";

const labelClass = "text-[12px] font-medium text-foreground-subtle";

/* -------------------------------------------------------------------------- */
/* Panel shell                                                                */
/* -------------------------------------------------------------------------- */

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-border bg-surface p-6">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-lg text-sm text-foreground-subtle">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* One social link                                                            */
/* -------------------------------------------------------------------------- */

function SocialRow({
  link,
  isFirst,
  isLast,
  onError,
}: {
  link: SocialLink;
  isFirst: boolean;
  isLast: boolean;
  onError: (error: string | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    onError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="overflow-hidden rounded-[14px] border border-border bg-background"
    >
      {editing ? (
        <form
          action={(formData) =>
            run(() => updateSocialLink(link.id, formData), () =>
              setEditing(false),
            )
          }
          className="flex flex-col gap-4 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor={`platform-${link.id}`}>
                Platform
              </label>
              <input
                id={`platform-${link.id}`}
                name="platform"
                defaultValue={link.platform}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor={`url-${link.id}`}>
                URL
              </label>
              <input
                id={`url-${link.id}`}
                name="url"
                defaultValue={link.url}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                onError(null);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-muted transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
            <Link2 className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium text-foreground">
              {link.platform}
            </span>
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 truncate text-[13px] text-foreground-subtle transition-colors hover:text-primary"
            >
              {link.url}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </span>

          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Move ${link.platform} up`}
              disabled={isFirst || isPending}
              onClick={() => run(() => moveSocialLink(link.id, "up"))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-30 disabled:hover:border-border-light"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${link.platform} down`}
              disabled={isLast || isPending}
              onClick={() => run(() => moveSocialLink(link.id, "down"))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-30 disabled:hover:border-border-light"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="ml-1 h-8 rounded-full border border-border-light px-3.5 text-[13px] text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground"
            >
              Edit
            </button>

            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => deleteSocialLink(link.id))}
                  className="h-8 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="h-8 px-2 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                aria-label={`Delete ${link.platform}`}
                onClick={() => setConfirmingDelete(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-foreground-subtle transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        </div>
      )}
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Add form                                                                   */
/* -------------------------------------------------------------------------- */

function AddSocialForm({ onError }: { onError: (e: string | null) => void }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = React.useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        onError(null);
        startTransition(async () => {
          const result = await createSocialLink(formData);
          if (!result.ok) {
            onError(result.error);
            return;
          }
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="mt-4 grid gap-4 rounded-[14px] border border-dashed border-border p-4 sm:grid-cols-[minmax(0,220px)_1fr_auto] sm:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="new-platform">
          Platform
        </label>
        <input
          id="new-platform"
          name="platform"
          required
          placeholder="GitHub"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="new-url">
          URL
        </label>
        <input
          id="new-url"
          name="url"
          required
          placeholder="github.com/rifatahmed"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add link
      </button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Resume panel                                                               */
/* -------------------------------------------------------------------------- */

function ResumePanel({
  resumeUrl,
  onError,
}: {
  resumeUrl: string | null;
  onError: (e: string | null) => void;
}) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  return (
    <div className="flex flex-col gap-5">
      {resumeUrl ? (
        <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-background p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium text-foreground">
              Resume uploaded
            </span>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] text-foreground-subtle transition-colors hover:text-primary"
            >
              View current PDF
              <ExternalLink className="h-3 w-3" />
            </a>
          </span>

          {confirmingDelete ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  onError(null);
                  startTransition(async () => {
                    const result = await deleteResume();
                    if (!result.ok) {
                      onError(result.error);
                      return;
                    }
                    setConfirmingDelete(false);
                    router.refresh();
                  });
                }}
                className="h-9 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                Confirm remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-9 px-2 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-subtle transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      ) : (
        <p className="rounded-[14px] border border-dashed border-border p-4 text-sm text-foreground-subtle">
          No resume uploaded yet — the footer&apos;s download button stays
          hidden until one exists.
        </p>
      )}

      <form
        ref={formRef}
        action={(formData) => {
          onError(null);
          startTransition(async () => {
            const result = await uploadResume(formData);
            if (!result.ok) {
              onError(result.error);
              return;
            }
            formRef.current?.reset();
            setFileName(null);
            router.refresh();
          });
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-border-light px-5 text-[13px] font-medium text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground">
          <Upload className="h-4 w-4" />
          {fileName ?? "Choose PDF"}
          <input
            type="file"
            name="resume"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
        </label>

        <button
          type="submit"
          disabled={isPending || !fileName}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {resumeUrl ? "Replace resume" : "Upload resume"}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function FooterEditor({
  socials,
  resumeUrl,
}: {
  socials: SocialLink[];
  resumeUrl: string | null;
}) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Footer</h1>
      <p className="mt-2 max-w-lg text-sm text-foreground-subtle">
        Social links and the downloadable CV shown at the bottom of every page.
      </p>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            className="mt-5 rounded-md border border-primary/40 bg-accent-soft px-4 py-3 text-sm text-primary"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-col gap-6">
        <Panel
          title="Social Links"
          description="Shown in the footer's Connect column, in this order. Recognised platform names (GitHub, LinkedIn, X, Instagram, YouTube, Dribbble, Email…) get a matching icon; anything else falls back to a globe."
        >
          {socials.length > 0 && (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {socials.map((link, index) => (
                  <SocialRow
                    key={link.id}
                    link={link}
                    isFirst={index === 0}
                    isLast={index === socials.length - 1}
                    onError={setError}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}

          <AddSocialForm onError={setError} />
        </Panel>

        <Panel
          title="Resume"
          description="A single PDF, replaced in place. The footer's Download CV button links straight to it."
        >
          <ResumePanel resumeUrl={resumeUrl} onError={setError} />
        </Panel>
      </div>
    </div>
  );
}

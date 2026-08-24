"use client";

/**
 * Phase 7 — Achievements admin screen.
 *
 * Two panels: the section header copy (singleton) and the certificates
 * themselves. One `CertificateForm` serves both "add" and "edit" — the fields
 * are identical, and keeping them in one component means the two can't drift
 * apart.
 *
 * Chrome (Panel, Field, the input/button class strings) is imported from the
 * Projects admin's `ui.tsx` rather than copied again, so every CMS screen stays
 * visually identical.
 *
 * The scan uploads straight to Supabase Storage from the browser (see
 * `features/achievements/upload.ts`); the form only submits the resulting URL
 * and storage key, because Next.js caps Server Action bodies at 1 MB and a
 * certificate scan is routinely larger than that.
 *
 * Uploading is optional by design. A certificate with no scan still renders as
 * a typeset plate on the public wall, so the admin can list credentials first
 * and hunt down the PDFs later without the section looking broken in between.
 */

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Check,
  ImageUp,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ErrorBanner,
  Field,
  ghostButtonClass,
  iconButtonClass,
  inputClass,
  labelClass,
  Panel,
  primaryButtonClass,
  textareaClass,
} from "../projects/ui";
import type {
  Achievement,
  AchievementsSection,
} from "@/features/achievements/data";
import {
  ACCEPTED_CERTIFICATE_TYPES,
  DEFAULT_CATEGORIES,
  formatIssued,
  MAX_ACHIEVEMENTS,
  MAX_TITLE_LENGTH,
  toMonthInput,
} from "@/features/achievements/constants";
import { uploadCertificate } from "@/features/achievements/upload";
import {
  createAchievement,
  deleteAchievement,
  moveAchievement,
  updateAchievement,
  updateAchievementsSection,
  type ActionResult,
} from "@/features/achievements/actions";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Lets `CertificateForm` show a spinner without every caller threading it. */
const PendingContext = React.createContext(false);

type ScanValue = { url: string; storage_path: string | null };

/* -------------------------------------------------------------------------- */
/* Scan picker                                                                */
/* -------------------------------------------------------------------------- */

function ScanPicker({
  scopeId,
  value,
  onChange,
  onError,
}: {
  /** Namespaces the upload key — the row id, or a fresh uuid for new rows. */
  scopeId: string;
  value: ScanValue | null;
  onChange: (value: ScanValue | null) => void;
  onError: (error: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    onError(null);
    setUploading(true);
    const result = await uploadCertificate(file, scopeId);
    setUploading(false);

    // Let the same file be re-picked after a failure.
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onChange({
      url: result.certificate.url,
      storage_path: result.certificate.storage_path,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Landscape, matching the frame's opening on the public wall. */}
      <span className="relative flex h-[74px] w-[105px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-background">
        {value?.url ? (
          <Image
            src={value.url}
            alt=""
            fill
            sizes="105px"
            className="object-contain"
          />
        ) : (
          <Award className="h-6 w-6 text-foreground-subtle" strokeWidth={1.5} />
        )}
      </span>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cn(
              ghostButtonClass,
              "cursor-pointer",
              uploading && "pointer-events-none opacity-50",
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageUp className="h-3.5 w-3.5" />
            )}
            {value?.url ? "Replace scan" : "Upload scan"}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_CERTIFICATE_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>

          {value?.url && (
            <button
              type="button"
              onClick={() => {
                onError(null);
                onChange(null);
              }}
              className={cn(
                iconButtonClass,
                "hover:border-primary/50 hover:text-primary",
              )}
              aria-label="Remove scan"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <p className="max-w-sm text-[12px] text-foreground-subtle/70">
          PNG, JPG, WebP or AVIF, up to 8 MB. Landscape reads best — the frame
          opening is A-series landscape. Leave this empty and the wall sets the
          certificate as type instead, which is a finished look in its own
          right.
        </p>
      </div>

      {/* Submitted with the form; the action pairs them (see actions.ts). */}
      <input type="hidden" name="image_url" value={value?.url ?? ""} />
      <input
        type="hidden"
        name="image_storage_path"
        value={value?.storage_path ?? ""}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Certificate form — shared by "add" and "edit"                              */
/* -------------------------------------------------------------------------- */

function CertificateForm({
  achievement,
  submitLabel,
  onSubmit,
  onCancel,
  onError,
}: {
  /** Undefined = a new certificate. */
  achievement?: Achievement;
  submitLabel: string;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
  onError: (error: string | null) => void;
}) {
  const isPending = React.useContext(PendingContext);

  const [scan, setScan] = React.useState<ScanValue | null>(
    achievement?.image_url
      ? {
          url: achievement.image_url,
          storage_path: achievement.image_storage_path,
        }
      : null,
  );

  // Stable across re-renders so every upload for one new certificate lands in
  // the same folder; `useState` initialiser rather than `useRef` + effect.
  const [newScopeId] = React.useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `new-${Date.now()}`,
  );

  const uid = achievement?.id ?? "new";

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <Field
        label="Title"
        htmlFor={`title-${uid}`}
        hint="What the certificate is called. Set in Brunson on the public site, which has no lowercase glyphs — it renders in caps."
      >
        <input
          id={`title-${uid}`}
          name="title"
          required
          maxLength={MAX_TITLE_LENGTH}
          defaultValue={achievement?.title}
          placeholder="Google Cloud Foundations"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Issuer"
          htmlFor={`issuer-${uid}`}
          hint="Who awarded it. Shown on the placard and in the viewer."
        >
          <input
            id={`issuer-${uid}`}
            name="issuer"
            defaultValue={achievement?.issuer}
            placeholder="Google Cloud"
            className={inputClass}
          />
        </Field>

        <Field
          label="Category"
          htmlFor={`category-${uid}`}
          hint="One word. Suggestions offered, but anything is allowed."
        >
          <input
            id={`category-${uid}`}
            name="category"
            list="achievement-categories"
            defaultValue={achievement?.category}
            placeholder="Cloud"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Issued"
          htmlFor={`issued-${uid}`}
          hint="Month and year. Leave blank to show no date."
        >
          <input
            id={`issued-${uid}`}
            name="issued_on"
            type="month"
            defaultValue={toMonthInput(achievement?.issued_on ?? null)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Credential link"
          htmlFor={`credential-${uid}`}
          hint="Optional. Adds a View credential button to the viewer."
        >
          <input
            id={`credential-${uid}`}
            name="credential_url"
            type="url"
            inputMode="url"
            defaultValue={achievement?.credential_url}
            placeholder="https://www.credential.net/..."
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Certificate scan</span>
        <ScanPicker
          scopeId={achievement?.id ?? newScopeId}
          value={scan}
          onChange={setScan}
          onError={onError}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {submitLabel}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className={ghostButtonClass}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* One row in the list                                                        */
/* -------------------------------------------------------------------------- */

function CertificateRow({
  achievement,
  isFirst,
  isLast,
  onError,
}: {
  achievement: Achievement;
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

  const issued = formatIssued(achievement.issued_on);
  const meta = [achievement.issuer, issued, achievement.category]
    .filter(Boolean)
    .join(" · ");

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
        <div className="p-4 sm:p-5">
          <PendingContext.Provider value={isPending}>
            <CertificateForm
              achievement={achievement}
              submitLabel="Save certificate"
              onError={onError}
              onCancel={() => {
                setEditing(false);
                onError(null);
              }}
              onSubmit={(formData) =>
                run(
                  () => updateAchievement(achievement.id, formData),
                  () => setEditing(false),
                )
              }
            />
          </PendingContext.Provider>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="relative flex h-11 w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-border-light bg-surface">
            {achievement.image_url ? (
              <Image
                src={achievement.image_url}
                alt=""
                fill
                sizes="62px"
                className="object-contain"
              />
            ) : (
              <Award
                className="h-4 w-4 text-foreground-subtle"
                strokeWidth={1.6}
              />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-foreground">
              {achievement.title}
            </span>
            <span className="block truncate text-[13px] text-foreground-subtle">
              {meta || "No issuer or date yet"}
              {!achievement.image_url && " · set as type"}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Move ${achievement.title} earlier`}
              disabled={isFirst || isPending}
              onClick={() => run(() => moveAchievement(achievement.id, "up"))}
              className={iconButtonClass}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${achievement.title} later`}
              disabled={isLast || isPending}
              onClick={() => run(() => moveAchievement(achievement.id, "down"))}
              className={iconButtonClass}
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
                  onClick={() => run(() => deleteAchievement(achievement.id))}
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
                aria-label={`Delete ${achievement.title}`}
                onClick={() => setConfirmingDelete(true)}
                className={cn(
                  iconButtonClass,
                  "hover:border-primary/50 hover:text-primary",
                )}
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
/* Add certificate                                                            */
/* -------------------------------------------------------------------------- */

function AddCertificate({
  disabled,
  onError,
}: {
  /** True once the wall is at `MAX_ACHIEVEMENTS`. */
  disabled: boolean;
  onError: (error: string | null) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  // Remounts the form after a successful save so its uncontrolled fields reset.
  const [formKey, setFormKey] = React.useState(0);

  if (disabled) {
    return (
      <p className="mt-4 rounded-[14px] border border-dashed border-border p-4 text-[13px] text-foreground-subtle">
        That&apos;s {MAX_ACHIEVEMENTS} certificates — the wall stops reading as a
        gallery past this. Delete one before adding another.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border p-4 text-[13px] text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add certificate
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-dashed border-border p-4 sm:p-5">
      <p className="mb-4 text-[13px] text-foreground-subtle">
        New certificates hang at the end of the wall — reorder with the arrows
        afterwards.
      </p>

      <PendingContext.Provider value={isPending}>
        <CertificateForm
          key={formKey}
          submitLabel="Add certificate"
          onError={onError}
          onCancel={() => {
            setOpen(false);
            onError(null);
          }}
          onSubmit={(formData) => {
            onError(null);
            startTransition(async () => {
              const result = await createAchievement(formData);
              if (!result.ok) {
                onError(result.error);
                return;
              }
              setFormKey((key) => key + 1);
              setOpen(false);
              router.refresh();
            });
          }}
        />
      </PendingContext.Provider>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section header copy                                                        */
/* -------------------------------------------------------------------------- */

function SectionCopyForm({
  section,
  onError,
}: {
  section: AchievementsSection;
  onError: (error: string | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  return (
    <form
      action={(formData) => {
        onError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await updateAchievementsSection(formData);
          if (!result.ok) {
            onError(result.error);
            return;
          }
          setSaved(true);
          router.refresh();
        });
      }}
      className="flex flex-col gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr]">
        <Field label="Eyebrow" htmlFor="achievements-eyebrow">
          <input
            id="achievements-eyebrow"
            name="eyebrow"
            required
            defaultValue={section.eyebrow}
            className={inputClass}
          />
        </Field>

        <Field
          label="Display heading"
          htmlFor="achievements-heading"
          hint="Set in Brunson, which has no lowercase glyphs — it renders in caps."
        >
          <input
            id="achievements-heading"
            name="heading"
            required
            defaultValue={section.heading}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Burgundy words"
        htmlFor="achievements-accent"
        hint="The part of the heading set in burgundy — type it exactly as it appears above. Leave blank for an all-cream heading."
      >
        <input
          id="achievements-accent"
          name="heading_accent"
          defaultValue={section.heading_accent}
          placeholder="that reflect"
          className={inputClass}
        />
      </Field>

      <Field
        label="Standfirst"
        htmlFor="achievements-standfirst"
        hint="The short paragraph under the heading. Leave blank to hide it."
      >
        <textarea
          id="achievements-standfirst"
          name="standfirst"
          rows={3}
          defaultValue={section.standfirst}
          className={textareaClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Save header
        </button>

        <AnimatePresence>
          {saved && !isPending && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-[13px] text-foreground-subtle"
            >
              Saved.
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function AchievementsEditor({
  section,
  achievements,
}: {
  section: AchievementsSection;
  achievements: Achievement[];
}) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        Achievements
      </h1>
      <p className="mt-2 max-w-lg text-sm text-foreground-subtle">
        The certificate wall, between the services list and the contact form.
        Certificates hang left to right in this order — lead with the one you
        most want read first.
      </p>

      {/* Shared by every category input on this screen. */}
      <datalist id="achievement-categories">
        {DEFAULT_CATEGORIES.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <div className="mt-5">
        <ErrorBanner error={error} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Panel
          title="Section header"
          description="The numbered eyebrow, the display heading, which of its words are burgundy, and the paragraph beneath."
        >
          <SectionCopyForm section={section} onError={setError} />
        </Panel>

        <Panel
          title="Certificates"
          description="One row per certificate. A scan is optional — without one, the wall sets the certificate as type instead."
        >
          {achievements.length > 0 ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {achievements.map((achievement, index) => (
                  <CertificateRow
                    key={achievement.id}
                    achievement={achievement}
                    isFirst={index === 0}
                    isLast={index === achievements.length - 1}
                    onError={setError}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="rounded-[14px] border border-dashed border-border p-4 text-sm text-foreground-subtle">
              No certificates yet — the Achievements section stays hidden on the
              public site until one exists.
            </p>
          )}

          <AddCertificate
            disabled={achievements.length >= MAX_ACHIEVEMENTS}
            onError={setError}
          />
        </Panel>
      </div>
    </div>
  );
}

"use client";

/**
 * Phase 5 — Career Journey admin screen.
 *
 * Two panels: the section header copy (singleton) and the timeline entries
 * themselves. One `EntryForm` serves both "add" and "edit" — the fields are
 * identical and keeping them in one component means the two can't drift apart.
 *
 * Chrome (Panel, Field, the input/button class strings) is imported from the
 * Projects admin's `ui.tsx` rather than copied again, so all three CMS screens
 * stay visually identical.
 *
 * Logo files upload straight to Supabase Storage from here (see
 * `features/career/upload.ts`); the form only submits the resulting URL and
 * storage key, which keeps the Server Action body well under Next's 1 MB cap.
 */

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Building2,
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
import type { CareerEntry, CareerSection } from "@/features/career/data";
import {
  ACCEPTED_LOGO_TYPES,
  EMPLOYMENT_TYPES,
  formatPeriod,
  isVectorLogo,
  MAX_HIGHLIGHTS,
  MAX_SKILLS,
  toMonthInput,
} from "@/features/career/constants";
import { uploadCareerLogo } from "@/features/career/upload";
import {
  createCareerEntry,
  deleteCareerEntry,
  moveCareerEntry,
  updateCareerEntry,
  updateCareerSection,
  type ActionResult,
} from "@/features/career/actions";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Lets `EntryForm` show a spinner without every caller threading the flag. */
const PendingContext = React.createContext(false);

/* -------------------------------------------------------------------------- */
/* Logo picker                                                                */
/* -------------------------------------------------------------------------- */

type LogoValue = { url: string; storage_path: string | null };

function LogoPicker({
  scopeId,
  value,
  onChange,
  onError,
}: {
  /** Namespaces the upload key — the entry id, or a fresh uuid for new rows. */
  scopeId: string;
  value: LogoValue | null;
  onChange: (value: LogoValue | null) => void;
  onError: (error: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    onError(null);
    setUploading(true);
    const result = await uploadCareerLogo(file, scopeId);
    setUploading(false);

    // Let the same file be re-picked after a failure.
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onChange({
      url: result.logo.url,
      storage_path: result.logo.storage_path,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-border bg-background">
        {value?.url ? (
          <Image
            src={value.url}
            alt=""
            fill
            sizes="64px"
            unoptimized={isVectorLogo(value.url)}
            className="object-contain"
          />
        ) : (
          <Building2 className="h-6 w-6 text-foreground-subtle" strokeWidth={1.5} />
        )}
      </span>

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
          {value?.url ? "Replace logo" : "Upload logo"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_LOGO_TYPES.join(",")}
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
            className={cn(iconButtonClass, "hover:border-primary/50 hover:text-primary")}
            aria-label="Remove logo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="w-full text-[12px] text-foreground-subtle/70">
        PNG, JPG, WebP, AVIF or SVG, up to 2 MB. Square marks sit best in the
        timeline. Removing the logo falls back to a neutral building glyph.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Entry form — shared by "add" and "edit"                                    */
/* -------------------------------------------------------------------------- */

function EntryForm({
  entry,
  submitLabel,
  onSubmit,
  onCancel,
  onError,
}: {
  /** Undefined = a new entry. */
  entry?: CareerEntry;
  submitLabel: string;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
  onError: (error: string | null) => void;
}) {
  const isPending = React.useContext(PendingContext);

  const [isCurrent, setIsCurrent] = React.useState(
    entry ? !entry.end_date : false,
  );
  const [logo, setLogo] = React.useState<LogoValue | null>(
    entry?.logo_url
      ? { url: entry.logo_url, storage_path: entry.logo_storage_path }
      : null,
  );

  // Stable across re-renders so every upload for one new entry lands in the
  // same folder; `useState` initialiser rather than `useRef` + effect.
  const [newScopeId] = React.useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `new-${Date.now()}`,
  );

  const uid = entry?.id ?? "new";

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role" htmlFor={`role-${uid}`}>
          <input
            id={`role-${uid}`}
            name="role"
            required
            defaultValue={entry?.role}
            placeholder="Administrator & Social Media Manager"
            className={inputClass}
          />
        </Field>

        <Field label="Company" htmlFor={`company-${uid}`}>
          <input
            id={`company-${uid}`}
            name="company"
            required
            defaultValue={entry?.company}
            placeholder="Samstop UK LTD"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Employment type"
          htmlFor={`employment-${uid}`}
          hint="Shown next to the company name."
        >
          <input
            id={`employment-${uid}`}
            name="employment_type"
            list="career-employment-types"
            defaultValue={entry?.employment_type}
            placeholder="Full-time"
            className={inputClass}
          />
        </Field>

        <Field label="Location" htmlFor={`location-${uid}`}>
          <input
            id={`location-${uid}`}
            name="location"
            defaultValue={entry?.location}
            placeholder="United Kingdom · Remote"
            className={inputClass}
          />
        </Field>

        <Field
          label="Company website"
          htmlFor={`company-url-${uid}`}
          hint="Optional — turns the company name into a link."
        >
          <input
            id={`company-url-${uid}`}
            name="company_url"
            defaultValue={entry?.company_url ?? ""}
            placeholder="samstop.co.uk"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start" htmlFor={`start-${uid}`}>
          <input
            id={`start-${uid}`}
            name="start_date"
            type="month"
            defaultValue={toMonthInput(entry?.start_date ?? null)}
            className={inputClass}
          />
        </Field>

        <Field label="End" htmlFor={`end-${uid}`}>
          <input
            id={`end-${uid}`}
            name="end_date"
            type="month"
            disabled={isCurrent}
            defaultValue={toMonthInput(entry?.end_date ?? null)}
            className={cn(inputClass, isCurrent && "opacity-40")}
          />
          <label className="mt-2 inline-flex items-center gap-2 text-[13px] text-foreground-muted">
            <input
              type="checkbox"
              name="is_current"
              checked={isCurrent}
              onChange={(event) => setIsCurrent(event.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I currently work here
          </label>
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor={`description-${uid}`}
        hint="One paragraph: what the company does and what the role was."
      >
        <textarea
          id={`description-${uid}`}
          name="description"
          rows={4}
          defaultValue={entry?.description}
          placeholder="Samstop UK LTD is a consultancy and UK sponsorship company…"
          className={textareaClass}
        />
      </Field>

      <Field
        label="Highlights"
        htmlFor={`highlights-${uid}`}
        hint={`One per line, up to ${MAX_HIGHLIGHTS}. Rendered as the bullet list on the card.`}
      >
        <textarea
          id={`highlights-${uid}`}
          name="highlights"
          rows={4}
          defaultValue={entry?.highlights.join("\n")}
          placeholder={"Ran day-to-day administration…\nOwned the social media presence…"}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Skills"
        htmlFor={`skills-${uid}`}
        hint={`Comma separated, up to ${MAX_SKILLS}. Rendered as the pill row.`}
      >
        <input
          id={`skills-${uid}`}
          name="skills"
          defaultValue={entry?.skills.join(", ")}
          placeholder="Administration, Social Media Management, Reporting"
          className={inputClass}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Company logo</span>
        <LogoPicker
          scopeId={entry?.id ?? newScopeId}
          value={logo}
          onChange={setLogo}
          onError={onError}
        />
      </div>

      {/* The picker's result travels with the form; the file itself never does. */}
      <input type="hidden" name="logo_url" value={logo?.url ?? ""} />
      <input
        type="hidden"
        name="logo_storage_path"
        value={logo?.storage_path ?? ""}
      />

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

function EntryRow({
  entry,
  isFirst,
  isLast,
  onError,
}: {
  entry: CareerEntry;
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

  const period = formatPeriod(entry.start_date, entry.end_date);

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
            <EntryForm
              entry={entry}
              submitLabel="Save entry"
              onError={onError}
              onCancel={() => {
                setEditing(false);
                onError(null);
              }}
              onSubmit={(formData) =>
                run(
                  () => updateCareerEntry(entry.id, formData),
                  () => setEditing(false),
                )
              }
            />
          </PendingContext.Provider>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-border-light bg-surface">
            {entry.logo_url ? (
              <Image
                src={entry.logo_url}
                alt=""
                fill
                sizes="44px"
                unoptimized={isVectorLogo(entry.logo_url)}
                className="object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 text-foreground-subtle" />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-foreground">
              {entry.role}
            </span>
            <span className="block truncate text-[13px] text-foreground-subtle">
              {entry.company}
              {period && ` · ${period}`}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Move ${entry.role} up`}
              disabled={isFirst || isPending}
              onClick={() => run(() => moveCareerEntry(entry.id, "up"))}
              className={iconButtonClass}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${entry.role} down`}
              disabled={isLast || isPending}
              onClick={() => run(() => moveCareerEntry(entry.id, "down"))}
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
                  onClick={() => run(() => deleteCareerEntry(entry.id))}
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
                aria-label={`Delete ${entry.role}`}
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
/* Add entry                                                                  */
/* -------------------------------------------------------------------------- */

function AddEntry({ onError }: { onError: (error: string | null) => void }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  // Remounts the form after a successful save so its uncontrolled fields and
  // logo picker reset to empty.
  const [formKey, setFormKey] = React.useState(0);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border p-4 text-[13px] text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add entry
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-dashed border-border p-4 sm:p-5">
      <p className="mb-4 text-[13px] text-foreground-subtle">
        New entries go to the top of the timeline — reorder with the arrows
        afterwards.
      </p>

      <PendingContext.Provider value={isPending}>
        <EntryForm
          key={formKey}
          submitLabel="Add entry"
          onError={onError}
          onCancel={() => {
            setOpen(false);
            onError(null);
          }}
          onSubmit={(formData) => {
            onError(null);
            startTransition(async () => {
              const result = await createCareerEntry(formData);
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
  section: CareerSection;
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
          const result = await updateCareerSection(formData);
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
        <Field label="Eyebrow" htmlFor="career-eyebrow">
          <input
            id="career-eyebrow"
            name="eyebrow"
            required
            defaultValue={section.eyebrow}
            className={inputClass}
          />
        </Field>

        <Field
          label="Display heading"
          htmlFor="career-heading"
          hint="Set in Brunson, which has no lowercase glyphs — it renders in caps."
        >
          <input
            id="career-heading"
            name="heading"
            required
            defaultValue={section.heading}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Standfirst"
        htmlFor="career-standfirst"
        hint="The short paragraph beside the heading. Leave blank to hide it."
      >
        <textarea
          id="career-standfirst"
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

export function CareerEditor({
  section,
  entries,
}: {
  section: CareerSection;
  entries: CareerEntry[];
}) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        Career Journey
      </h1>
      <p className="mt-2 max-w-lg text-sm text-foreground-subtle">
        The experience timeline on the home page. Entries render top to bottom
        in this order — newest first reads best.
      </p>

      <div className="mt-5">
        <ErrorBanner error={error} />
      </div>

      {/* Suggestions for the employment-type input; the field stays freeform. */}
      <datalist id="career-employment-types">
        {EMPLOYMENT_TYPES.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>

      <div className="mt-6 flex flex-col gap-6">
        <Panel
          title="Section header"
          description="The numbered eyebrow, display heading and standfirst above the timeline."
        >
          <SectionCopyForm section={section} onError={setError} />
        </Panel>

        <Panel
          title="Timeline"
          description="One entry per role. Everything on the public card — logo, dates, description, bullets and skill pills — is edited here."
        >
          {entries.length > 0 ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {entries.map((entry, index) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    isFirst={index === 0}
                    isLast={index === entries.length - 1}
                    onError={setError}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="rounded-[14px] border border-dashed border-border p-4 text-sm text-foreground-subtle">
              No entries yet — the Career Journey section stays hidden on the
              public site until one exists.
            </p>
          )}

          <AddEntry onError={setError} />
        </Panel>
      </div>
    </div>
  );
}

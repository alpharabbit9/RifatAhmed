"use client";

/**
 * Phase 6 — Services admin screen.
 *
 * Two panels: the section header copy (singleton, including the closing CTA)
 * and the offers themselves. One `ServiceForm` serves both "add" and "edit" —
 * the fields are identical, and keeping them in one component means the two
 * can't drift apart.
 *
 * Chrome (Panel, Field, the input/button class strings) is imported from the
 * Projects admin's `ui.tsx` rather than copied again, so every CMS screen
 * stays visually identical.
 *
 * The icon is picked from a visual grid rather than typed: `icon_name` is an
 * allow-list key (features/services/icons.ts), so showing the actual glyphs is
 * both easier to use and impossible to typo.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
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
import type { Service, ServicesSection } from "@/features/services/data";
import {
  MAX_DELIVERABLES,
  MAX_SERVICES,
  MAX_TITLE_LENGTH,
} from "@/features/services/constants";
import {
  getServiceIcon,
  SERVICE_ICON_NAMES,
  type ServiceIconName,
} from "@/features/services/icons";
import {
  createService,
  deleteService,
  moveService,
  updateService,
  updateServicesSection,
  type ActionResult,
} from "@/features/services/actions";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Lets `ServiceForm` show a spinner without every caller threading the flag. */
const PendingContext = React.createContext(false);

/* -------------------------------------------------------------------------- */
/* Icon picker                                                                */
/* -------------------------------------------------------------------------- */

function IconPicker({
  value,
  onChange,
}: {
  value: ServiceIconName;
  onChange: (value: ServiceIconName) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Service icon"
      className="flex flex-wrap gap-2"
    >
      {SERVICE_ICON_NAMES.map((name) => {
        const Icon = getServiceIcon(name);
        const selected = name === value;

        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={name}
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border transition-colors ring-brand",
              selected
                ? "border-primary bg-accent-soft text-foreground"
                : "border-border-light text-foreground-subtle hover:border-foreground/35 hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Service form — shared by "add" and "edit"                                  */
/* -------------------------------------------------------------------------- */

function ServiceForm({
  service,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  /** Undefined = a new service. */
  service?: Service;
  submitLabel: string;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
}) {
  const isPending = React.useContext(PendingContext);

  const [icon, setIcon] = React.useState<ServiceIconName>(() => {
    const current = service?.icon_name;
    return current && (SERVICE_ICON_NAMES as string[]).includes(current)
      ? (current as ServiceIconName)
      : "sparkles";
  });

  const uid = service?.id ?? "new";

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <Field
        label="Title"
        htmlFor={`title-${uid}`}
        hint="Set in Brunson on the public site, which has no lowercase glyphs — it renders in caps."
      >
        <input
          id={`title-${uid}`}
          name="title"
          required
          maxLength={MAX_TITLE_LENGTH}
          defaultValue={service?.title}
          placeholder="AI Agents & Chatbots"
          className={inputClass}
        />
      </Field>

      <Field
        label="Summary"
        htmlFor={`summary-${uid}`}
        hint="One paragraph, in the client's terms — what this is and why they'd want it."
      >
        <textarea
          id={`summary-${uid}`}
          name="summary"
          rows={3}
          defaultValue={service?.summary}
          placeholder="Agents that do the job rather than demo it…"
          className={textareaClass}
        />
      </Field>

      <Field
        label="Deliverables"
        htmlFor={`deliverables-${uid}`}
        hint={`One per line, up to ${MAX_DELIVERABLES}. Rendered as the list beside the summary.`}
      >
        <textarea
          id={`deliverables-${uid}`}
          name="deliverables"
          rows={4}
          defaultValue={service?.deliverables.join("\n")}
          placeholder={
            "RAG pipelines over your documents\nTool-calling agents with MCP integrations"
          }
          className={textareaClass}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Icon</span>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      <input type="hidden" name="icon_name" value={icon} />

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

function ServiceRow({
  service,
  isFirst,
  isLast,
  onError,
}: {
  service: Service;
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

  const Icon = getServiceIcon(service.icon_name);

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
            <ServiceForm
              service={service}
              submitLabel="Save service"
              onCancel={() => {
                setEditing(false);
                onError(null);
              }}
              onSubmit={(formData) =>
                run(
                  () => updateService(service.id, formData),
                  () => setEditing(false),
                )
              }
            />
          </PendingContext.Provider>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-border-light bg-surface text-foreground-subtle">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-foreground">
              {service.title}
            </span>
            <span className="block truncate text-[13px] text-foreground-subtle">
              {service.deliverables.length > 0
                ? `${service.deliverables.length} deliverable${
                    service.deliverables.length > 1 ? "s" : ""
                  }`
                : "No deliverables yet"}
              {service.summary ? ` · ${service.summary}` : ""}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Move ${service.title} up`}
              disabled={isFirst || isPending}
              onClick={() => run(() => moveService(service.id, "up"))}
              className={iconButtonClass}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${service.title} down`}
              disabled={isLast || isPending}
              onClick={() => run(() => moveService(service.id, "down"))}
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
                  onClick={() => run(() => deleteService(service.id))}
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
                aria-label={`Delete ${service.title}`}
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
/* Add service                                                                */
/* -------------------------------------------------------------------------- */

function AddService({
  disabled,
  onError,
}: {
  /** True once the list is at `MAX_SERVICES`. */
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
        That&apos;s {MAX_SERVICES} services — the list stops reading as a menu
        past this. Delete one before adding another.
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
        Add service
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-dashed border-border p-4 sm:p-5">
      <p className="mb-4 text-[13px] text-foreground-subtle">
        New services go to the bottom of the list — reorder with the arrows
        afterwards.
      </p>

      <PendingContext.Provider value={isPending}>
        <ServiceForm
          key={formKey}
          submitLabel="Add service"
          onCancel={() => {
            setOpen(false);
            onError(null);
          }}
          onSubmit={(formData) => {
            onError(null);
            startTransition(async () => {
              const result = await createService(formData);
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
  section: ServicesSection;
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
          const result = await updateServicesSection(formData);
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
        <Field label="Eyebrow" htmlFor="services-eyebrow">
          <input
            id="services-eyebrow"
            name="eyebrow"
            required
            defaultValue={section.eyebrow}
            className={inputClass}
          />
        </Field>

        <Field
          label="Display heading"
          htmlFor="services-heading"
          hint="Set in Brunson, which has no lowercase glyphs — it renders in caps."
        >
          <input
            id="services-heading"
            name="heading"
            required
            defaultValue={section.heading}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Standfirst"
        htmlFor="services-standfirst"
        hint="The short paragraph beside the heading. Leave blank to hide it."
      >
        <textarea
          id="services-standfirst"
          name="standfirst"
          rows={3}
          defaultValue={section.standfirst}
          className={textareaClass}
        />
      </Field>

      <Field
        label="Closing line"
        htmlFor="services-cta-note"
        hint="The sentence beside the button under the list. Leave blank to hide it."
      >
        <textarea
          id="services-cta-note"
          name="cta_note"
          rows={2}
          defaultValue={section.cta_note}
          className={textareaClass}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Button label"
          htmlFor="services-cta-label"
          hint="Leave blank to hide the button entirely."
        >
          <input
            id="services-cta-label"
            name="cta_label"
            defaultValue={section.cta_label}
            placeholder="Start a project"
            className={inputClass}
          />
        </Field>

        <Field
          label="Button link"
          htmlFor="services-cta-href"
          hint="An anchor on this page (#contact) or a full URL."
        >
          <input
            id="services-cta-href"
            name="cta_href"
            defaultValue={section.cta_href}
            placeholder="#contact"
            className={inputClass}
          />
        </Field>
      </div>

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

export function ServicesEditor({
  section,
  services,
}: {
  section: ServicesSection;
  services: Service[];
}) {
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Services</h1>
      <p className="mt-2 max-w-lg text-sm text-foreground-subtle">
        What you offer, between the career timeline and the contact form.
        Services render top to bottom in this order — lead with the one you most
        want to be hired for.
      </p>

      <div className="mt-5">
        <ErrorBanner error={error} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <Panel
          title="Section header"
          description="The numbered eyebrow, display heading, standfirst and the call to action under the list."
        >
          <SectionCopyForm section={section} onError={setError} />
        </Panel>

        <Panel
          title="Services"
          description="One row per offer. Title, summary, deliverables and icon are all edited here."
        >
          {services.length > 0 ? (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {services.map((service, index) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isFirst={index === 0}
                    isLast={index === services.length - 1}
                    onError={setError}
                  />
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <p className="rounded-[14px] border border-dashed border-border p-4 text-sm text-foreground-subtle">
              No services yet — the Services section stays hidden on the public
              site until one exists.
            </p>
          )}

          <AddService
            disabled={services.length >= MAX_SERVICES}
            onError={setError}
          />
        </Panel>
      </div>
    </div>
  );
}

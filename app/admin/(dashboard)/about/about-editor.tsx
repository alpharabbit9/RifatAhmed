"use client";

/**
 * Phase 2 admin — About Me, Education and the Tech Stack groups.
 *
 * One screen because they render as one public section: editing the story and
 * the capability groups in the same place matches what the visitor sees.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AboutContent,
  EducationEntry,
  SkillGroup,
} from "@/features/about/data";
import {
  SKILL_ICON_NAMES,
  getSkillIcon,
} from "@/features/about/icons";
import {
  createEducation,
  createSkill,
  createSkillGroup,
  deleteEducation,
  deleteSkill,
  deleteSkillGroup,
  moveEducation,
  moveSkill,
  moveSkillGroup,
  updateAbout,
  updateEducation,
  updateSkill,
  updateSkillGroup,
  type ActionResult,
} from "@/features/about/actions";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const inputClass =
  "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary";

const textareaClass =
  "w-full rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-primary";

const labelClass = "text-[12px] font-medium text-foreground-subtle";

const primaryButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50";

const ghostButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-muted transition-colors hover:text-foreground";

const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-foreground-muted transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-30 disabled:hover:border-border-light";

/** Shared transition + error plumbing for every action on this screen. */
function useAction(onError: (error: string | null) => void) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const run = React.useCallback(
    (action: () => Promise<ActionResult>, onSuccess?: () => void) => {
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
    },
    [onError, router],
  );

  return { run, isPending };
}

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
      <p className="mt-1.5 max-w-xl text-sm text-foreground-subtle">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ErrorBanner({ error }: { error: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          role="alert"
          className="overflow-hidden text-sm text-primary"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Story copy                                                                 */
/* -------------------------------------------------------------------------- */

function StoryPanel({ about }: { about: AboutContent }) {
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const { run, isPending } = useAction(setError);

  return (
    <Panel
      title="Story"
      description="The narrative half of the About section. Wrap phrases in **double asterisks** to highlight them in cream with a burgundy underline."
    >
      <form
        action={(formData) =>
          run(() => updateAbout(formData), () => {
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2400);
          })
        }
        className="flex flex-col gap-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="eyebrow">
              Eyebrow
            </label>
            <input
              id="eyebrow"
              name="eyebrow"
              defaultValue={about.eyebrow}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="heading">
              Display heading — one line per row
            </label>
            <textarea
              id="heading"
              name="heading"
              rows={3}
              defaultValue={about.heading}
              className={textareaClass}
            />
            <p className="text-[12px] text-foreground-subtle/70">
              Each line rolls in separately; the last one renders in burgundy.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="body">
            About copy
          </label>
          <textarea
            id="body"
            name="body"
            rows={9}
            defaultValue={about.body}
            className={textareaClass}
          />
          <p className="text-[12px] text-foreground-subtle/70">
            Separate paragraphs with a blank line.
          </p>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="stack_eyebrow">
              Tech stack eyebrow
            </label>
            <input
              id="stack_eyebrow"
              name="stack_eyebrow"
              defaultValue={about.stack_eyebrow}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="stack_heading">
              Tech stack heading
            </label>
            <input
              id="stack_heading"
              name="stack_heading"
              defaultValue={about.stack_heading}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="stack_body">
            Tech stack intro
          </label>
          <textarea
            id="stack_body"
            name="stack_body"
            rows={3}
            defaultValue={about.stack_body}
            className={textareaClass}
          />
        </div>

        <ErrorBanner error={error} />

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className={primaryButtonClass}>
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save story
          </button>

          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-foreground-subtle"
              >
                Saved — the public page is already updated.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Education                                                                  */
/* -------------------------------------------------------------------------- */

function EducationFields({ entry }: { entry?: EducationEntry }) {
  const prefix = entry ? entry.id : "new";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={`degree-${prefix}`}>
            Degree
          </label>
          <input
            id={`degree-${prefix}`}
            name="degree"
            required
            defaultValue={entry?.degree}
            placeholder="BSc in Computer Science and Engineering"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={`institution-${prefix}`}>
            Institution
          </label>
          <input
            id={`institution-${prefix}`}
            name="institution"
            required
            defaultValue={entry?.institution}
            placeholder="Leading University"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={`timeframe-${prefix}`}>
            Timeframe (optional)
          </label>
          <input
            id={`timeframe-${prefix}`}
            name="timeframe"
            defaultValue={entry?.timeframe ?? ""}
            placeholder="2022 — Present"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={`note-${prefix}`}>
            Note (optional)
          </label>
          <input
            id={`note-${prefix}`}
            name="note"
            defaultValue={entry?.note ?? ""}
            placeholder="Coursework, focus area, honours…"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

function EducationRow({
  entry,
  isFirst,
  isLast,
  onError,
}: {
  entry: EducationEntry;
  isFirst: boolean;
  isLast: boolean;
  onError: (error: string | null) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const { run, isPending } = useAction(onError);

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
            run(() => updateEducation(entry.id, formData), () =>
              setEditing(false),
            )
          }
          className="flex flex-col gap-4 p-4"
        >
          <EducationFields entry={entry} />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={isPending} className={primaryButtonClass}>
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
              className={ghostButtonClass}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-4 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
            <GraduationCap className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium text-foreground">
              {entry.degree}
            </span>
            <span className="block truncate text-[13px] text-foreground-subtle">
              {entry.institution}
              {entry.timeframe ? ` · ${entry.timeframe}` : ""}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Move ${entry.degree} up`}
              disabled={isFirst || isPending}
              onClick={() => run(() => moveEducation(entry.id, "up"))}
              className={iconButtonClass}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Move ${entry.degree} down`}
              disabled={isLast || isPending}
              onClick={() => run(() => moveEducation(entry.id, "down"))}
              className={iconButtonClass}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Edit ${entry.degree}`}
              onClick={() => setEditing(true)}
              className={iconButtonClass}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {confirming ? (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => deleteEducation(entry.id))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className={iconButtonClass}
                  aria-label="Cancel delete"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                aria-label={`Delete ${entry.degree}`}
                onClick={() => setConfirming(true)}
                className={iconButtonClass}
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

function EducationPanel({ entries }: { entries: EducationEntry[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const { run, isPending } = useAction(setError);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Panel
      title="Education"
      description="Rendered as cards under the story. Most relevant first."
    >
      <div className="flex flex-col gap-4">
        {entries.length > 0 && (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {entries.map((entry, index) => (
                <EducationRow
                  key={entry.id}
                  entry={entry}
                  isFirst={index === 0}
                  isLast={index === entries.length - 1}
                  onError={setError}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        <ErrorBanner error={error} />

        {adding ? (
          <form
            ref={formRef}
            action={(formData) =>
              run(() => createEducation(formData), () => {
                formRef.current?.reset();
                setAdding(false);
              })
            }
            className="flex flex-col gap-4 rounded-[14px] border border-dashed border-border p-4"
          >
            <EducationFields />
            <div className="flex items-center gap-2">
              <button type="submit" disabled={isPending} className={primaryButtonClass}>
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add education
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className={ghostButtonClass}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-muted transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add education
          </button>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Skills within a group                                                      */
/* -------------------------------------------------------------------------- */

function SkillChip({
  skill,
  groupId,
  isFirst,
  isLast,
  onError,
}: {
  skill: SkillGroup["skills"][number];
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
  onError: (error: string | null) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const { run, isPending } = useAction(onError);

  if (editing) {
    return (
      <li>
        <form
          action={(formData) =>
            run(() => updateSkill(skill.id, formData), () => setEditing(false))
          }
          className="flex items-center gap-1.5"
        >
          <input
            name="label"
            defaultValue={skill.label}
            autoFocus
            aria-label="Skill name"
            className="h-8 w-36 rounded-md border border-primary/60 bg-background px-2 text-[13px] text-foreground outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            aria-label="Save skill"
            className={iconButtonClass}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => setEditing(false)}
            className={iconButtonClass}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      </li>
    );
  }

  return (
    <motion.li
      layout
      transition={{ duration: 0.25, ease: EASE }}
      className="group/skill inline-flex items-center gap-1 rounded-md border border-[rgba(91,15,24,0.45)] bg-[rgba(91,15,24,0.16)] py-1 pl-3 pr-1.5 text-[13px] text-foreground-muted"
    >
      <button
        type="button"
        onClick={() => setEditing(true)}
        title="Rename"
        className="transition-colors hover:text-foreground"
      >
        {skill.label}
      </button>

      <span className="flex items-center opacity-0 transition-opacity group-focus-within/skill:opacity-100 group-hover/skill:opacity-100">
        <button
          type="button"
          aria-label={`Move ${skill.label} left`}
          disabled={isFirst || isPending}
          onClick={() => run(() => moveSkill(skill.id, groupId, "up"))}
          className="flex h-6 w-5 items-center justify-center text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-25"
        >
          <ArrowUp className="h-3 w-3 -rotate-90" />
        </button>
        <button
          type="button"
          aria-label={`Move ${skill.label} right`}
          disabled={isLast || isPending}
          onClick={() => run(() => moveSkill(skill.id, groupId, "down"))}
          className="flex h-6 w-5 items-center justify-center text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-25"
        >
          <ArrowDown className="h-3 w-3 -rotate-90" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${skill.label}`}
          disabled={isPending}
          onClick={() => run(() => deleteSkill(skill.id))}
          className="flex h-6 w-6 items-center justify-center text-foreground-subtle transition-colors hover:text-primary disabled:opacity-25"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Skill group                                                                */
/* -------------------------------------------------------------------------- */

function IconPicker({ defaultValue }: { defaultValue: string }) {
  const [selected, setSelected] = React.useState(defaultValue);

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClass}>Icon</span>
      <input type="hidden" name="icon_name" value={selected} />
      <div className="flex flex-wrap gap-1.5">
        {SKILL_ICON_NAMES.map((name) => {
          const Icon = getSkillIcon(name);
          const active = name === selected;
          return (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={active}
              onClick={() => setSelected(name)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                active
                  ? "border-primary bg-accent-soft text-primary"
                  : "border-border text-foreground-subtle hover:border-foreground/35 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroupFields({ group }: { group?: SkillGroup }) {
  const prefix = group ? group.id : "new";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor={`title-${prefix}`}>
          Group title
        </label>
        <input
          id={`title-${prefix}`}
          name="title"
          required
          defaultValue={group?.title}
          placeholder="AI & Intelligent Systems"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor={`summary-${prefix}`}>
          Summary (optional)
        </label>
        <textarea
          id={`summary-${prefix}`}
          name="summary"
          rows={2}
          defaultValue={group?.summary ?? ""}
          placeholder="One line on what you actually build with these."
          className={textareaClass}
        />
      </div>

      <IconPicker defaultValue={group?.icon_name ?? "sparkles"} />
    </div>
  );
}

function GroupCard({
  group,
  index,
  total,
  onError,
}: {
  group: SkillGroup;
  index: number;
  total: number;
  onError: (error: string | null) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const { run, isPending } = useAction(onError);
  const skillFormRef = React.useRef<HTMLFormElement>(null);
  const Icon = getSkillIcon(group.icon_name);

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
            run(() => updateSkillGroup(group.id, formData), () =>
              setEditing(false),
            )
          }
          className="flex flex-col gap-4 p-4"
        >
          <GroupFields group={group} />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={isPending} className={primaryButtonClass}>
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save group
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                onError(null);
              }}
              className={ghostButtonClass}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
              <Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-foreground">
                {group.title}
              </span>
              {group.summary && (
                <span className="block text-[13px] text-foreground-subtle">
                  {group.summary}
                </span>
              )}
            </span>

            <span className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Move ${group.title} up`}
                disabled={index === 0 || isPending}
                onClick={() => run(() => moveSkillGroup(group.id, "up"))}
                className={iconButtonClass}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Move ${group.title} down`}
                disabled={index === total - 1 || isPending}
                onClick={() => run(() => moveSkillGroup(group.id, "down"))}
                className={iconButtonClass}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Edit ${group.title}`}
                onClick={() => setEditing(true)}
                className={iconButtonClass}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {confirming ? (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => deleteSkillGroup(group.id))}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete group
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel delete"
                    onClick={() => setConfirming(false)}
                    className={iconButtonClass}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Delete ${group.title}`}
                  onClick={() => setConfirming(true)}
                  className={iconButtonClass}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          </div>

          <ul className="flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {group.skills.map((skill, skillIndex) => (
                <SkillChip
                  key={skill.id}
                  skill={skill}
                  groupId={group.id}
                  isFirst={skillIndex === 0}
                  isLast={skillIndex === group.skills.length - 1}
                  onError={onError}
                />
              ))}
            </AnimatePresence>

            <li>
              <form
                ref={skillFormRef}
                action={(formData) =>
                  run(() => createSkill(group.id, formData), () =>
                    skillFormRef.current?.reset(),
                  )
                }
                className="flex items-center gap-1.5"
              >
                <input
                  name="label"
                  required
                  placeholder="Add skill…"
                  aria-label={`Add a skill to ${group.title}`}
                  className="h-8 w-32 rounded-md border border-dashed border-border bg-transparent px-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-foreground-subtle/60 focus-visible:border-primary"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  aria-label={`Add skill to ${group.title}`}
                  className={iconButtonClass}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </motion.li>
  );
}

function StackPanel({ groups }: { groups: SkillGroup[] }) {
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const { run, isPending } = useAction(setError);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <Panel
      title="Tech stack"
      description="Each group renders as a numbered card in the second half of the About section. Hover a chip to reorder, rename or remove it."
    >
      <div className="flex flex-col gap-4">
        {groups.length > 0 && (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {groups.map((group, index) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={index}
                  total={groups.length}
                  onError={setError}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}

        <ErrorBanner error={error} />

        {adding ? (
          <form
            ref={formRef}
            action={(formData) =>
              run(() => createSkillGroup(formData), () => {
                formRef.current?.reset();
                setAdding(false);
              })
            }
            className="flex flex-col gap-4 rounded-[14px] border border-dashed border-border p-4"
          >
            <GroupFields />
            <div className="flex items-center gap-2">
              <button type="submit" disabled={isPending} className={primaryButtonClass}>
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add group
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className={ghostButtonClass}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-border-light px-4 text-[13px] text-foreground-muted transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add group
          </button>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export interface AboutEditorProps {
  about: AboutContent;
  education: EducationEntry[];
  groups: SkillGroup[];
}

export function AboutEditor({ about, education, groups }: AboutEditorProps) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        About &amp; Tech Stack
      </h1>
      <p className="mt-2 max-w-xl text-sm text-foreground-muted">
        These three panels all feed the single{" "}
        <a
          href="/#about"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline decoration-primary/60 underline-offset-4 hover:text-primary"
        >
          About section
        </a>{" "}
        on the public site.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <StoryPanel about={about} />
        <EducationPanel entries={education} />
        <StackPanel groups={groups} />
      </div>
    </div>
  );
}

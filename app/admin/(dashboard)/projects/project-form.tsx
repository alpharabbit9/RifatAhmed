"use client";

/**
 * Phase 4 admin — the create/edit form for one project.
 *
 * Everything the public card renders is edited here, in the order the card
 * reads: identity (title/subtitle/category), the story, the screenshots, the
 * feature highlights, the tech stack, then the metadata and publish state.
 *
 * Two things worth knowing:
 *
 *  · Screenshots upload to Supabase Storage the moment they're chosen, from
 *    the browser (`features/projects/upload.ts`) — Server Actions cap bodies
 *    at 1 MB. Only metadata travels with the save. A new project gets a
 *    client-generated folder id so its files are namespaced before the row
 *    exists; abandoning the form removes whatever was uploaded in the session.
 *
 *  · "Use on card" picks the showcase image — the one shot the
 *    ProjectShowcaseCard displays. The rest stay in the gallery for the case
 *    study page. The pick is tracked by storage path, which survives the save
 *    (a brand-new image has no row id yet).
 *
 * The live preview renders the real `<ProjectShowcaseCard>` against the
 * current form state, so what the admin approves is literally what ships.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createProject,
  discardUploads,
  updateProject,
} from "@/features/projects/actions";
import {
  DEFAULT_CATEGORIES,
  MAX_FEATURES,
  MAX_HIGHLIGHTS,
  MAX_IMAGES,
  MAX_TECHNOLOGIES,
  slugify,
} from "@/features/projects/constants";
import {
  FEATURE_ICON_NAMES,
  getFeatureIcon,
} from "@/features/projects/icons";
import { ProjectShowcaseCard } from "@/features/projects/project-showcase-card";
import { uploadProjectImage } from "@/features/projects/upload";
import type {
  ProjectFeatureInput,
  ProjectHighlightInput,
  ProjectRow,
  ProjectStatus,
  ShowcaseProject,
} from "@/features/projects/types";
import {
  ErrorBanner,
  Field,
  ghostButtonClass,
  hintClass,
  iconButtonClass,
  inputClass,
  labelClass,
  Panel,
  primaryButtonClass,
  textareaClass,
} from "./ui";

/** An image row in the form — `id` is null until the project is saved. */
type FormImage = {
  id: string | null;
  url: string;
  storage_path: string | null;
  alt: string | null;
};

/** Stable per-image key for React and for the showcase pick. */
function imageKey(image: FormImage): string {
  return image.storage_path ?? image.url;
}

/* -------------------------------------------------------------------------- */
/* Technology chips                                                           */
/* -------------------------------------------------------------------------- */

function TechnologyInput({
  values,
  suggestions,
  onChange,
}: {
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const listId = React.useId();

  const add = (label: string) => {
    const clean = label.trim();
    if (!clean) return;

    const duplicate = values.some(
      (value) => value.toLowerCase() === clean.toLowerCase(),
    );
    if (duplicate || values.length >= MAX_TECHNOLOGIES) {
      setDraft("");
      return;
    }

    onChange([...values, clean]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(91,15,24,0.45)] bg-[rgba(91,15,24,0.16)] px-2.5 py-1.5 text-[13px] text-foreground-muted"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((entry) => entry !== value))}
              aria-label={`Remove ${value}`}
              className="text-foreground-subtle transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <p className={hintClass}>No technologies yet.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          list={listId}
          placeholder="React, Next.js, Supabase…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter must not submit the form — it commits the chip instead.
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          className={cn(inputClass, "max-w-xs")}
          aria-label="Add a technology"
        />
        <datalist id={listId}>
          {suggestions
            .filter(
              (suggestion) =>
                !values.some(
                  (value) => value.toLowerCase() === suggestion.toLowerCase(),
                ),
            )
            .map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
        </datalist>
        <button type="button" onClick={() => add(draft)} className={ghostButtonClass}>
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      <p className={hintClass}>
        Enter or comma adds a chip. Known names (React, Next.js, MongoDB…) show
        their brand mark on the card; anything else falls back to its initials.
        Up to {MAX_TECHNOLOGIES}.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature rows                                                               */
/* -------------------------------------------------------------------------- */

function FeatureRows({
  features,
  onChange,
}: {
  features: ProjectFeatureInput[];
  onChange: (next: ProjectFeatureInput[]) => void;
}) {
  const update = (index: number, patch: Partial<ProjectFeatureInput>) => {
    onChange(
      features.map((feature, position) =>
        position === index ? { ...feature, ...patch } : feature,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {features.map((feature, index) => {
          const Icon = getFeatureIcon(feature.icon);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 rounded-[14px] border border-border bg-background p-4 sm:grid-cols-[auto_1fr_1.4fr_auto] sm:items-end">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`feature-icon-${index}`}>
                    Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border-light">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
                    </span>
                    <select
                      id={`feature-icon-${index}`}
                      value={feature.icon}
                      onChange={(event) => update(index, { icon: event.target.value })}
                      className={cn(inputClass, "w-[120px]")}
                    >
                      {FEATURE_ICON_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Field label="Title" htmlFor={`feature-title-${index}`}>
                  <input
                    id={`feature-title-${index}`}
                    value={feature.title}
                    placeholder="AI Analysis"
                    onChange={(event) => update(index, { title: event.target.value })}
                    className={inputClass}
                  />
                </Field>

                <Field label="Description" htmlFor={`feature-description-${index}`}>
                  <input
                    id={`feature-description-${index}`}
                    value={feature.description}
                    placeholder="Resume scoring & smart insights"
                    onChange={(event) =>
                      update(index, { description: event.target.value })
                    }
                    className={inputClass}
                  />
                </Field>

                <button
                  type="button"
                  onClick={() =>
                    onChange(features.filter((_, position) => position !== index))
                  }
                  className={cn(iconButtonClass, "mb-0.5")}
                  aria-label={`Remove feature ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={features.length >= MAX_FEATURES}
          onClick={() =>
            onChange([...features, { icon: "sparkles", title: "", description: "" }])
          }
          className={ghostButtonClass}
        >
          <Plus className="h-4 w-4" />
          Add feature
        </button>
        <p className={hintClass}>
          {features.length}/{MAX_FEATURES} — three reads best on the card.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Screenshot gallery                                                         */
/* -------------------------------------------------------------------------- */

function ImageManager({
  images,
  showcaseKey,
  projectFolder,
  onChange,
  onShowcaseChange,
  onUploaded,
  onError,
}: {
  images: FormImage[];
  showcaseKey: string | null;
  projectFolder: string;
  onChange: (next: FormImage[]) => void;
  onShowcaseChange: (key: string | null) => void;
  onUploaded: (path: string) => void;
  onError: (message: string | null) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      onError(`That's the ${MAX_IMAGES}-image limit — remove one first.`);
      return;
    }

    setUploading(true);
    onError(null);

    const accepted: FormImage[] = [];

    for (const file of Array.from(fileList).slice(0, room)) {
      const result = await uploadProjectImage(file, projectFolder);

      if (!result.ok) {
        onError(result.error);
        continue;
      }

      onUploaded(result.image.storage_path);
      accepted.push({
        id: null,
        url: result.image.url,
        storage_path: result.image.storage_path,
        alt: null,
      });
    }

    if (accepted.length > 0) {
      const next = [...images, ...accepted];
      onChange(next);
      // First image ever uploaded becomes the card shot automatically.
      if (!showcaseKey) {
        onShowcaseChange(imageKey(accepted[0]));
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (image: FormImage) => {
    const next = images.filter((entry) => imageKey(entry) !== imageKey(image));
    onChange(next);

    if (showcaseKey === imageKey(image)) {
      onShowcaseChange(next.length > 0 ? imageKey(next[0]) : null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className={primaryButtonClass}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Upload images"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          hidden
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <p className={hintClass}>
          {images.length}/{MAX_IMAGES} · PNG, JPG, WebP or AVIF up to 8 MB.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-border p-6 text-center text-sm text-foreground-subtle">
          No screenshots yet. The card falls back to a placeholder frame until
          one is uploaded.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => {
            const key = imageKey(image);
            const isShowcase = key === showcaseKey;

            return (
              <li
                key={key}
                className={cn(
                  "overflow-hidden rounded-[14px] border bg-background transition-colors",
                  isShowcase ? "border-primary" : "border-border",
                )}
              >
                <div className="relative aspect-[16/10] w-full bg-surface-elevated">
                  <Image
                    src={image.url}
                    alt={image.alt ?? "Project screenshot"}
                    fill
                    sizes="(max-width: 640px) 90vw, 320px"
                    className="object-cover object-top"
                  />
                  {isShowcase && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                      <Star className="h-3 w-3 fill-current" />
                      On card
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 p-3">
                  <input
                    value={image.alt ?? ""}
                    placeholder="Alt text (optional)"
                    onChange={(event) =>
                      onChange(
                        images.map((entry) =>
                          imageKey(entry) === key
                            ? { ...entry, alt: event.target.value }
                            : entry,
                        ),
                      )
                    }
                    aria-label="Image alt text"
                    className={cn(inputClass, "h-9 text-[13px]")}
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onShowcaseChange(key)}
                      disabled={isShowcase}
                      className={cn(
                        ghostButtonClass,
                        "h-9 px-3 text-[12px]",
                        isShowcase && "border-primary text-primary opacity-100",
                      )}
                    >
                      {isShowcase ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Showcase image
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5" />
                          Use on card
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(image)}
                      className={iconButtonClass}
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Project highlights (case-study page)                                       */
/* -------------------------------------------------------------------------- */

/**
 * The numbers under the tech stack on `/projects/<slug>` — a figure, a label
 * and an icon. Same shape as `FeatureRows` above; kept separate because the
 * fields differ and merging them would mean a mode flag on every row.
 */
function HighlightRows({
  highlights,
  onChange,
}: {
  highlights: ProjectHighlightInput[];
  onChange: (next: ProjectHighlightInput[]) => void;
}) {
  const update = (index: number, patch: Partial<ProjectHighlightInput>) => {
    onChange(
      highlights.map((highlight, position) =>
        position === index ? { ...highlight, ...patch } : highlight,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {highlights.map((highlight, index) => {
          const Icon = getFeatureIcon(highlight.icon);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 rounded-[14px] border border-border bg-background p-4 sm:grid-cols-[auto_1fr_1.4fr_auto] sm:items-end">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} htmlFor={`highlight-icon-${index}`}>
                    Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border-light">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
                    </span>
                    <select
                      id={`highlight-icon-${index}`}
                      value={highlight.icon}
                      onChange={(event) => update(index, { icon: event.target.value })}
                      className={cn(inputClass, "w-[120px]")}
                    >
                      {FEATURE_ICON_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Field label="Value" htmlFor={`highlight-value-${index}`}>
                  <input
                    id={`highlight-value-${index}`}
                    value={highlight.value}
                    placeholder="3K+"
                    maxLength={12}
                    onChange={(event) => update(index, { value: event.target.value })}
                    className={inputClass}
                  />
                </Field>

                <Field label="Label" htmlFor={`highlight-label-${index}`}>
                  <input
                    id={`highlight-label-${index}`}
                    value={highlight.label}
                    placeholder="Users"
                    onChange={(event) => update(index, { label: event.target.value })}
                    className={inputClass}
                  />
                </Field>

                <button
                  type="button"
                  onClick={() =>
                    onChange(highlights.filter((_, position) => position !== index))
                  }
                  className={cn(iconButtonClass, "mb-0.5")}
                  aria-label={`Remove highlight ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={highlights.length >= MAX_HIGHLIGHTS}
          onClick={() =>
            onChange([...highlights, { icon: "users", value: "", label: "" }])
          }
          className={ghostButtonClass}
        >
          <Plus className="h-4 w-4" />
          Add highlight
        </button>
        <p className={hintClass}>
          {highlights.length}/{MAX_HIGHLIGHTS} — three fit the row best. Leave it
          empty to hide the section.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

export function ProjectForm({
  project,
  technologySuggestions,
}: {
  /** Absent = create mode. */
  project?: ProjectRow;
  technologySuggestions: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(project);

  // Storage folder for this form's uploads. Existing projects reuse their own
  // id; a new one gets a client-generated uuid so files can land before the
  // row does.
  const [folder] = React.useState(
    () => project?.id ?? globalThis.crypto.randomUUID(),
  );

  const [title, setTitle] = React.useState(project?.title ?? "");
  const [slug, setSlug] = React.useState(project?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(project?.slug));
  const [subtitle, setSubtitle] = React.useState(project?.subtitle ?? "");
  const [description, setDescription] = React.useState(project?.description ?? "");
  const [category, setCategory] = React.useState(project?.category ?? "Full Stack");
  const [year, setYear] = React.useState(project?.year ?? "");
  const [role, setRole] = React.useState(project?.role ?? "");
  const [liveDemo, setLiveDemo] = React.useState(project?.live_demo_url ?? "");
  const [sourceCode, setSourceCode] = React.useState(project?.source_code_url ?? "");
  const [status, setStatus] = React.useState<ProjectStatus>(project?.status ?? "draft");
  const [featured, setFeatured] = React.useState(project?.featured ?? true);

  // Case-study copy (/projects/<slug>). `about` is edited as one textarea and
  // split into paragraphs on save — a repeater for prose would be busywork.
  const [about, setAbout] = React.useState((project?.about ?? []).join("\n\n"));
  const [highlights, setHighlights] = React.useState<ProjectHighlightInput[]>(
    project?.highlights ?? [],
  );
  const [challenge, setChallenge] = React.useState(project?.challenge ?? "");
  const [solution, setSolution] = React.useState(project?.solution ?? "");
  const [impact, setImpact] = React.useState(project?.impact ?? "");

  const [technologies, setTechnologies] = React.useState<string[]>(
    project?.technologies ?? [],
  );
  const [features, setFeatures] = React.useState<ProjectFeatureInput[]>(
    project?.features ?? [],
  );

  const [images, setImages] = React.useState<FormImage[]>(
    (project?.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      storage_path: image.storage_path,
      alt: image.alt,
    })),
  );
  const [showcaseKey, setShowcaseKey] = React.useState<string | null>(() => {
    const chosen = (project?.images ?? []).find(
      (image) => image.id === project?.showcase_image_id,
    );
    const fallback = (project?.images ?? [])[0];
    const picked = chosen ?? fallback;
    return picked ? (picked.storage_path ?? picked.url) : null;
  });

  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(true);
  const [isPending, startTransition] = React.useTransition();

  // Files uploaded during this session; discarded if the admin cancels so the
  // bucket doesn't collect orphans.
  const sessionUploads = React.useRef<string[]>([]);

  const effectiveSlug = slugTouched && slug ? slugify(slug) : slugify(title || "project");

  const preview: ShowcaseProject = {
    title: title || "Project title",
    subtitle,
    category: category || "Category",
    description,
    screenshot:
      images.find((image) => imageKey(image) === showcaseKey)?.url ??
      images[0]?.url ??
      null,
    features: features
      .filter((feature) => feature.title.trim())
      .map((feature) => ({
        icon: getFeatureIcon(feature.icon),
        title: feature.title,
        description: feature.description,
      })),
    technologies,
    year,
    role,
    projectUrl: `/projects/${effectiveSlug}`,
    liveDemo: liveDemo.trim() ? liveDemo.trim() : undefined,
  };

  const save = () => {
    setError(null);

    const payload = {
      slug: effectiveSlug,
      title,
      subtitle,
      description,
      category,
      technologies,
      features,
      year,
      role,
      live_demo_url: liveDemo,
      source_code_url: sourceCode,
      status,
      featured,
      // One paragraph per line; blank lines are dropped by the action.
      about: about.split(/\n+/),
      highlights,
      challenge,
      solution,
      impact,
      images,
      showcase_storage_path: showcaseKey,
    };

    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Saved files are the project's now — cancelling later must not delete
      // them.
      sessionUploads.current = [];
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);

      router.push("/admin/projects");
      router.refresh();
    });
  };

  const cancel = () => {
    const orphans = sessionUploads.current;
    sessionUploads.current = [];

    if (orphans.length > 0) {
      void discardUploads(orphans);
    }
    router.push("/admin/projects");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-2 text-[13px] text-foreground-subtle transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Projects
          </Link>
          <h1 className="mt-2 font-display text-3xl text-foreground">
            {isEdit ? "Edit project" : "New project"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            className={ghostButtonClass}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <button type="button" onClick={cancel} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className={primaryButtonClass}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {isEdit ? "Save project" : "Create project"}
          </button>
        </div>
      </div>

      <ErrorBanner error={error} />

      {/* Live preview of the real card — same component the site renders. */}
      <AnimatePresence initial={false}>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-[18px] border border-border bg-background py-8">
              <p className="mb-6 px-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground-subtle">
                Card preview
              </p>
              <ProjectShowcaseCard project={preview} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Panel
        title="Identity"
        description="The badge, the display title and the kicker beneath it."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              value={title}
              placeholder="CareerLogic AI"
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Category"
            htmlFor="category"
            hint="Shown in the badge. Pick one or type your own."
          >
            <input
              id="category"
              list="project-categories"
              value={category}
              placeholder="AI Agent"
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            />
            <datalist id="project-categories">
              {DEFAULT_CATEGORIES.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>

          <Field
            label="Subtitle"
            htmlFor="subtitle"
            hint="Rendered uppercase in burgundy under the title."
          >
            <input
              id="subtitle"
              value={subtitle}
              placeholder="AI-Powered Resume Builder"
              onChange={(event) => setSubtitle(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="URL slug" htmlFor="slug" hint={`/projects/${effectiveSlug}`}>
            <input
              id="slug"
              value={slugTouched ? slug : effectiveSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field
            label="Description"
            htmlFor="description"
            hint="Three or four lines on the card — what it does and who it's for."
          >
            <textarea
              id="description"
              rows={4}
              value={description}
              placeholder="An AI powered platform that analyzes, tailors and optimizes resumes…"
              onChange={(event) => setDescription(event.target.value)}
              className={textareaClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Screenshots"
        description="Upload as many as you like, then choose the one that fills the card. The rest stay with the project for its case study."
      >
        <ImageManager
          images={images}
          showcaseKey={showcaseKey}
          projectFolder={folder}
          onChange={setImages}
          onShowcaseChange={setShowcaseKey}
          onUploaded={(path) => sessionUploads.current.push(path)}
          onError={setError}
        />
      </Panel>

      <Panel
        title="Core features"
        description="The three highlights beside the description — icon, title, one line."
      >
        <FeatureRows features={features} onChange={setFeatures} />
      </Panel>

      <Panel
        title="Tech stack"
        description="Rendered as the circular marks along the card's footer."
      >
        <TechnologyInput
          values={technologies}
          suggestions={technologySuggestions}
          onChange={setTechnologies}
        />
      </Panel>

      <Panel
        title="Case study page"
        description="The long-form copy on /projects/<slug> — everything the card has no room for. Leave any part empty and that block disappears from the page."
      >
        <div className="flex flex-col gap-6">
          <Field
            label="About the project"
            htmlFor="about"
            hint="One paragraph per line."
          >
            <textarea
              id="about"
              rows={5}
              value={about}
              placeholder={"What the project does, and who it is for.\nA second paragraph on how it was built."}
              onChange={(event) => setAbout(event.target.value)}
              className={textareaClass}
            />
          </Field>

          <div className="flex flex-col gap-3">
            <p className={labelClass}>Project highlights</p>
            <HighlightRows highlights={highlights} onChange={setHighlights} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Field label="Challenge" htmlFor="challenge">
              <textarea
                id="challenge"
                rows={5}
                value={challenge}
                placeholder="The problem the project had to solve."
                onChange={(event) => setChallenge(event.target.value)}
                className={textareaClass}
              />
            </Field>

            <Field label="Solution" htmlFor="solution">
              <textarea
                id="solution"
                rows={5}
                value={solution}
                placeholder="What you built, and why that way."
                onChange={(event) => setSolution(event.target.value)}
                className={textareaClass}
              />
            </Field>

            <Field label="Impact" htmlFor="impact">
              <textarea
                id="impact"
                rows={5}
                value={impact}
                placeholder="What changed once it shipped."
                onChange={(event) => setImpact(event.target.value)}
                className={textareaClass}
              />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel
        title="Metadata & links"
        description="The cream panel on the card, plus where its buttons point."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Year" htmlFor="year">
            <input
              id="year"
              value={year}
              placeholder="2025"
              onChange={(event) => setYear(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Role" htmlFor="role">
            <input
              id="role"
              value={role}
              placeholder="Full Stack Developer"
              onChange={(event) => setRole(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Live demo URL"
            htmlFor="live-demo"
            hint="Leave empty and the Live Demo button disappears."
          >
            <input
              id="live-demo"
              type="url"
              value={liveDemo}
              placeholder="https://example.com"
              onChange={(event) => setLiveDemo(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Source code URL" htmlFor="source-code" hint="Optional.">
            <input
              id="source-code"
              type="url"
              value={sourceCode}
              placeholder="https://github.com/…"
              onChange={(event) => setSourceCode(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Publishing" description="Drafts stay invisible to visitors.">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            {(["draft", "published"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                aria-pressed={status === option}
                className={cn(
                  "h-10 rounded-full border px-5 text-[13px] font-semibold capitalize transition-colors",
                  status === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-light text-foreground-muted hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground-muted">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 accent-[#5B0F18]"
            />
            Show in the featured set on the home page
          </label>
        </div>
      </Panel>

      <div className="flex items-center justify-end gap-2 pb-4">
        <button type="button" onClick={cancel} className={ghostButtonClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Save project" : "Create project"}
        </button>
      </div>
    </div>
  );
}

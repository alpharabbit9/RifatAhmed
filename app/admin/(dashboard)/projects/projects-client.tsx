"use client";

/**
 * Phase 4 admin — the project list.
 *
 * Row-per-project with the showcase thumbnail, publish state and the ordering
 * controls the public section reads. Everything destructive asks first; every
 * mutation runs through the same transition so the whole row disables while a
 * write is in flight.
 */

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteProject,
  moveProject,
  setProjectFeatured,
  setProjectStatus,
  type ProjectActionResult,
} from "@/features/projects/actions";
import { pickShowcaseImage } from "@/features/projects/constants";
import type { ProjectRow } from "@/features/projects/types";
import {
  EASE,
  ErrorBanner,
  ghostButtonClass,
  iconButtonClass,
  primaryButtonClass,
} from "./ui";

function StatusPill({ status }: { status: ProjectRow["status"] }) {
  const published = status === "published";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        published
          ? "bg-accent-soft text-foreground"
          : "border border-border-light text-foreground-subtle",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          published ? "bg-primary" : "bg-foreground-subtle/60",
        )}
      />
      {status}
    </span>
  );
}

function ProjectRowCard({
  project,
  index,
  total,
  run,
  busy,
}: {
  project: ProjectRow;
  index: number;
  total: number;
  run: (action: () => Promise<ProjectActionResult>) => void;
  busy: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const showcase = pickShowcaseImage(project);

  return (
    <li className="flex flex-col gap-4 rounded-[18px] border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[12px] border border-border bg-surface-elevated sm:w-[168px]">
        {showcase ? (
          <Image
            src={showcase.url}
            alt={showcase.alt ?? project.title}
            fill
            sizes="168px"
            className="object-cover object-top"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-foreground-subtle/50">
            <ImageOff className="h-5 w-5" strokeWidth={1.5} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-display text-lg text-foreground">{project.title}</h3>
          <StatusPill status={project.status} />
          {project.featured && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </span>
          )}
        </div>

        <p className="mt-1 text-[13px] text-foreground-subtle">
          {project.category}
          {project.year ? ` · ${project.year}` : ""}
          {project.technologies.length > 0
            ? ` · ${project.technologies.length} technologies`
            : ""}
          {project.images.length > 0 ? ` · ${project.images.length} images` : ""}
        </p>

        <p className="mt-1 truncate text-[12px] text-foreground-subtle/70">
          /projects/{project.slug}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || index === 0}
          onClick={() => run(() => moveProject(project.id, "up"))}
          className={iconButtonClass}
          aria-label={`Move ${project.title} up`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={busy || index === total - 1}
          onClick={() => run(() => moveProject(project.id, "down"))}
          className={iconButtonClass}
          aria-label={`Move ${project.title} down`}
        >
          <ArrowDown className="h-4 w-4" />
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => setProjectFeatured(project.id, !project.featured))}
          className={cn(ghostButtonClass, "h-9 px-3 text-[12px]")}
        >
          <Star className={cn("h-3.5 w-3.5", project.featured && "fill-current")} />
          {project.featured ? "Unfeature" : "Feature"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(() =>
              setProjectStatus(
                project.id,
                project.status === "published" ? "draft" : "published",
              ),
            )
          }
          className={cn(ghostButtonClass, "h-9 px-3 text-[12px]")}
        >
          {project.status === "published" ? "Unpublish" : "Publish"}
        </button>

        {project.live_demo_url && (
          <a
            href={project.live_demo_url}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClass}
            aria-label={`Open the ${project.title} live demo`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <Link
          href={`/admin/projects/${project.id}/edit`}
          className={iconButtonClass}
          aria-label={`Edit ${project.title}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>

        {confirmingDelete ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => deleteProject(project.id))}
              className="h-9 rounded-full bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className={cn(ghostButtonClass, "h-9 px-3 text-[12px]")}
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className={iconButtonClass}
            aria-label={`Delete ${project.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

export function ProjectsClient({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const run = React.useCallback(
    (action: () => Promise<ProjectActionResult>) => {
      setError(null);
      startTransition(async () => {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      });
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-overline">Site</p>
          <h1 className="mt-2 font-display text-3xl text-foreground">Projects</h1>
          <p className="mt-2 max-w-lg text-sm text-foreground-subtle">
            Each project renders as a full showcase card on the home page.
            Featured, published projects appear there in this order.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />}
          <Link href="/admin/projects/new" className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </div>
      </div>

      <ErrorBanner error={error} />

      {projects.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-border p-10 text-center">
          <p className="font-display text-xl text-foreground">No projects yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-foreground-subtle">
            Add your first project — title, screenshots, features and tech stack
            — and it will appear on the home page once published.
          </p>
          <Link href="/admin/projects/new" className={cn(primaryButtonClass, "mt-6")}>
            <Plus className="h-4 w-4" />
            New project
          </Link>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex flex-col gap-4"
          >
            {projects.map((project, index) => (
              <ProjectRowCard
                key={project.id}
                project={project}
                index={index}
                total={projects.length}
                run={run}
                busy={isPending}
              />
            ))}
          </motion.ul>
        </AnimatePresence>
      )}
    </div>
  );
}

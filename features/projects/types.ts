/**
 * Phase 4 — Projects: the shapes the public card, the case-study page and the
 * admin screens agree on.
 *
 * Three levels deliberately kept apart:
 *
 *   ProjectRow / ProjectImageRow   what Supabase stores (snake_case, icons as
 *                                  string keys, images as a gallery)
 *   ShowcaseProject                what `<ProjectShowcaseCard>` renders
 *                                  (camelCase, icons already resolved to
 *                                  components, one chosen screenshot)
 *   CaseStudyProject               what `/projects/<slug>` renders — the same
 *                                  project plus the long-form copy the card
 *                                  has no room for (about, highlights,
 *                                  challenge/solution/impact, full gallery)
 *
 * `features/projects/data.ts` maps the first onto the other two. Neither
 * presentation shape touches Supabase, so both render equally well from the
 * sample data in `projects.ts`.
 */

import type { LucideIcon } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Card-facing (presentation)                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Either a Lucide component (composing the data inside a Client Component) or
 * a key from `features/projects/icons.ts`.
 *
 * The string form exists because React Server Components cannot pass function
 * references across the boundary: data read from Supabase in a Server
 * Component carries the icon *name*, and the card resolves it on the client.
 */
export type ShowcaseFeatureIcon = LucideIcon | string;

export interface ShowcaseFeature {
  icon: ShowcaseFeatureIcon;
  title: string;
  description: string;
}

export interface ShowcaseProject {
  title: string;
  /** Uppercase kicker under the title — "AI-POWERED RESUME BUILDER". */
  subtitle: string;
  /** Badge copy — "AI AGENT", "FULL STACK", "RAG SYSTEM"… */
  category: string;
  description: string;
  /** Public URL of the chosen showcase image; `null` renders a placeholder. */
  screenshot: string | null;
  /** Overrides the default `alt` (the project title). */
  screenshotAlt?: string;
  /** 2–6 render comfortably; the grid adapts to any count. */
  features: ShowcaseFeature[];
  /** Free-text labels — brand marks are resolved from the shared registry. */
  technologies: string[];
  /**
   * Carried for the case-study page and the admin list. The card itself no
   * longer shows them — its cream corner block holds the tech stack instead.
   */
  year: string;
  role: string;
  /**
   * Whether the project is in the home page's featured set. The `/projects`
   * index tags those tiles; the home section filters on it (see `data.ts`).
   */
  featured?: boolean;
  /** Route to the case study — `/projects/<slug>`. */
  projectUrl: string;
  /** Omitted/undefined hides the Live Demo button entirely. */
  liveDemo?: string;
}

/* -------------------------------------------------------------------------- */
/* Case-study page (presentation)                                             */
/* -------------------------------------------------------------------------- */

/** One number in the PROJECT HIGHLIGHTS row — "3K+ Users", "2.3s Load Time". */
export interface ProjectHighlight {
  /** A key from `features/projects/icons.ts` (or a Lucide component). */
  icon: ShowcaseFeatureIcon;
  value: string;
  label: string;
}

/** A gallery entry: a public image URL plus its alt text (may be missing). */
export interface CaseStudyImage {
  url: string;
  alt: string | null;
}

/**
 * Everything `/projects/<slug>` renders. Every string, image and link arrives
 * through this one object — the page never branches on which project it is.
 *
 * Empty is always a valid value: an absent `liveDemo`/`sourceCode` drops that
 * metadata column, an empty `gallery` drops the thumbnail strip, an empty
 * `highlights` drops the highlights row, and an empty
 * `challenge`/`solution`/`impact` drops the closing section. Nothing renders a
 * placeholder.
 */
export interface CaseStudyProject {
  slug: string;
  title: string;
  /** Uppercase kicker under the title — "AI-POWERED RESUME BUILDER". */
  subtitle: string;
  /** Badge copy — "FEATURED PROJECT", "AI AGENT", "RAG SYSTEM"… */
  category: string;
  description: string;
  year: string;
  role: string;
  liveDemo?: string;
  sourceCode?: string;
  /**
   * The full screenshot set, showcase image first. The hero frame shows
   * whichever one is selected; the strip below shows all of them. Empty is
   * fine — the frame falls back to a burgundy placeholder.
   */
  gallery: CaseStudyImage[];
  /** ABOUT THE PROJECT — one entry per paragraph. */
  about: string[];
  features: ShowcaseFeature[];
  techStack: string[];
  highlights: ProjectHighlight[];
  challenge: string;
  solution: string;
  impact: string;
}

/* -------------------------------------------------------------------------- */
/* Database rows                                                              */
/* -------------------------------------------------------------------------- */

/** One entry of `projects.features` (JSONB); `icon` is a FEATURE_ICONS key. */
export interface ProjectFeatureInput {
  icon: string;
  title: string;
  description: string;
}

/** One entry of `projects.highlights` (JSONB); `icon` is a FEATURE_ICONS key. */
export interface ProjectHighlightInput {
  icon: string;
  value: string;
  label: string;
}

export interface ProjectImageRow {
  id: string;
  project_id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  display_order: number;
}

export type ProjectStatus = "draft" | "published";

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  technologies: string[];
  features: ProjectFeatureInput[];
  year: string;
  role: string;
  live_demo_url: string | null;
  source_code_url: string | null;
  status: ProjectStatus;
  featured: boolean;
  display_order: number;
  showcase_image_id: string | null;
  images: ProjectImageRow[];

  /* Case-study copy — added by `0005_project_case_study.sql`. Reads normalise
     these, so a database still on 0004 yields empty values rather than an
     error (see the `select("*")` note in data.ts). */
  about: string[];
  highlights: ProjectHighlightInput[];
  challenge: string;
  solution: string;
  impact: string;
}

/* -------------------------------------------------------------------------- */
/* Admin payload                                                              */
/* -------------------------------------------------------------------------- */

/**
 * An image the admin has already uploaded to the `media` bucket from the
 * browser (see `features/projects/upload.ts`). `id` is only present for
 * images that already have a row — new uploads carry `null` until saved.
 */
export interface ProjectImageInput {
  id: string | null;
  url: string;
  storage_path: string | null;
  alt: string | null;
}

export interface ProjectInput {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  technologies: string[];
  features: ProjectFeatureInput[];
  year: string;
  role: string;
  live_demo_url: string;
  source_code_url: string;
  status: ProjectStatus;
  featured: boolean;
  /** ABOUT THE PROJECT, one paragraph per entry (blank entries are dropped). */
  about: string[];
  highlights: ProjectHighlightInput[];
  challenge: string;
  solution: string;
  impact: string;
  images: ProjectImageInput[];
  /**
   * Which uploaded image fills the card. Matched on `storage_path` (stable
   * across the save, unlike the row id which new images don't have yet).
   */
  showcase_storage_path: string | null;
}

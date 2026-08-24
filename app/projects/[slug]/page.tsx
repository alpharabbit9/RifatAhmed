/**
 * Phase 4 — the public case study at `/projects/<slug>`.
 *
 * The route does three things and nothing else: resolve the slug, 404 when
 * there is no such project, and hand the data to `<ProjectCaseStudy>`. All
 * layout lives in `features/projects/detail/`.
 *
 * The read is wrapped in React's `cache()` because `generateMetadata` and the
 * page body both need the project and both run in the same request — without
 * it the same row would be fetched from Supabase twice per visit.
 *
 * Drafts are visible only to a signed-in admin (RLS decides, see
 * `getCaseStudyProject`), so an unpublished case study can be previewed at its
 * real URL before it goes live.
 */

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudyProject } from "@/features/projects/data";
import { ProjectCaseStudy } from "@/features/projects/detail/project-case-study";
import { toMetaDescription } from "@/lib/site";

const loadProject = cache(getCaseStudyProject);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await loadProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const title = project.subtitle
    ? `${project.title} — ${project.subtitle}`
    : project.title;

  const description = toMetaDescription(
    project.description || project.about[0],
  );

  // `title.absolute` opts out of the root layout's "%s | Rifat Ahmed"
  // template: a case-study title plus its subtitle is already long enough
  // without a suffix, and the site name is on the card anyway.
  //
  // No `openGraph.images` either — `opengraph-image.tsx` in this folder
  // renders the card for this exact slug, and setting both would emit two.
  return {
    title: { absolute: `${title} | Rifat Ahmed` },
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      url: `/projects/${slug}`,
      title,
      description,
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await loadProject(slug);

  if (!project) {
    notFound();
  }

  return <ProjectCaseStudy project={project} />;
}

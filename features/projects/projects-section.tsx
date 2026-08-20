/**
 * Phase 4 — Projects (Server Component shell).
 *
 * Fetches the published, featured projects and hands them to the client
 * component that owns layout and motion. Falls back to the sample project
 * when the migration hasn't been applied yet (see `data.ts`).
 */

import { getShowcaseProjects } from "@/features/projects/data";
import { ProjectsSectionContent } from "@/features/projects/projects-content";

export async function ProjectsSection() {
  const projects = await getShowcaseProjects({ featuredOnly: true });

  return <ProjectsSectionContent projects={projects} />;
}

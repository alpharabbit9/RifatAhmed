import { getAdminProjects } from "@/features/projects/data";
import { ProjectsClient } from "./projects-client";
import { MigrationNotice } from "./migration-notice";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const result = await getAdminProjects();

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return <ProjectsClient projects={result.projects} />;
}

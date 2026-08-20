import { notFound } from "next/navigation";
import {
  getAdminProject,
  getTechnologySuggestions,
} from "@/features/projects/data";
import { ProjectForm } from "../../project-form";
import { MigrationNotice } from "../../migration-notice";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [result, technologySuggestions] = await Promise.all([
    getAdminProject(id),
    getTechnologySuggestions(),
  ]);

  if (!result.ok) {
    // A deleted project is a 404; anything else is the schema not being there.
    if (result.error.includes("no longer exists")) {
      notFound();
    }
    return <MigrationNotice message={result.error} />;
  }

  return (
    <ProjectForm
      project={result.project}
      technologySuggestions={technologySuggestions}
    />
  );
}

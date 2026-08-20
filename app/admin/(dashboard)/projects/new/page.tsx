import { getTechnologySuggestions } from "@/features/projects/data";
import { ProjectForm } from "../project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  // Suggestions come from every project already saved plus the About
  // section's skill labels, so the two stay spelled the same way.
  const technologySuggestions = await getTechnologySuggestions();

  return <ProjectForm technologySuggestions={technologySuggestions} />;
}

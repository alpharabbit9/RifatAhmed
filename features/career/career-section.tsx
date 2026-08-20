/**
 * Phase 5 — Career Journey (Server Component shell).
 *
 * Fetches the admin-managed section copy and timeline entries in parallel,
 * then hands off to the client component that owns layout and motion. Falls
 * back to the seeded entry when the migration hasn't been applied yet (see
 * `data.ts`).
 */

import { getCareerEntries, getCareerSection } from "@/features/career/data";
import { CareerSectionContent } from "@/features/career/career-content";

export async function CareerSection() {
  const [section, entries] = await Promise.all([
    getCareerSection(),
    getCareerEntries(),
  ]);

  return <CareerSectionContent section={section} entries={entries} />;
}

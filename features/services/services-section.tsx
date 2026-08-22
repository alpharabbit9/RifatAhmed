/**
 * Phase 6 — Services (Server Component shell).
 *
 * Fetches the admin-managed section copy and the offers in parallel, then
 * hands off to the client component that owns layout and motion. Falls back to
 * the seeded content when the migration hasn't been applied yet (see
 * `data.ts`).
 */

import { getServices, getServicesSection } from "@/features/services/data";
import { ServicesSectionContent } from "@/features/services/services-content";

export async function ServicesSection() {
  const [section, services] = await Promise.all([
    getServicesSection(),
    getServices(),
  ]);

  return <ServicesSectionContent section={section} services={services} />;
}

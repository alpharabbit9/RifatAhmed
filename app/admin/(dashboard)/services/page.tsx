import { getAdminServices } from "@/features/services/data";
import { ServicesEditor } from "./services-editor";

export const dynamic = "force-dynamic";

/**
 * Shown when the Services tables aren't there yet. There is no database
 * connection string locally, so migrations are applied by hand in the Supabase
 * SQL editor — this names the file to run instead of surfacing a raw PostgREST
 * error.
 */
function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Services</h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0009_services.sql
          </code>{" "}
          in the Supabase SQL editor — it creates the{" "}
          <code className="text-foreground-muted">services_section</code> and{" "}
          <code className="text-foreground-muted">services</code> tables and
          seeds the four starting offers. Until then the public section renders
          the seeded copy from{" "}
          <code className="text-foreground-muted">
            features/services/data.ts
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function AdminServicesPage() {
  const result = await getAdminServices();

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return (
    <ServicesEditor section={result.section} services={result.services} />
  );
}

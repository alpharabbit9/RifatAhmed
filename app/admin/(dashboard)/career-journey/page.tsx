import { getAdminCareer } from "@/features/career/data";
import { CareerEditor } from "./career-editor";

export const dynamic = "force-dynamic";

/**
 * Shown when the Career Journey tables aren't there yet. There is no database
 * connection string locally, so migrations are applied by hand in the Supabase
 * SQL editor — this names the file to run instead of surfacing a raw PostgREST
 * error.
 */
function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        Career Journey
      </h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0006_career_journey.sql
          </code>{" "}
          in the Supabase SQL editor — it creates the{" "}
          <code className="text-foreground-muted">career_section</code> and{" "}
          <code className="text-foreground-muted">career_journey</code> tables
          and seeds the first entry. Until then the public timeline renders the
          seeded copy from{" "}
          <code className="text-foreground-muted">features/career/data.ts</code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function AdminCareerJourneyPage() {
  const result = await getAdminCareer();

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return <CareerEditor section={result.section} entries={result.entries} />;
}

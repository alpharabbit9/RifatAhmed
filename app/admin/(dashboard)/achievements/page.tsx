import { getAdminAchievements } from "@/features/achievements/data";
import { AchievementsEditor } from "./achievements-editor";

export const dynamic = "force-dynamic";

/**
 * Shown when the Achievements tables aren't there yet. There is no database
 * connection string locally, so migrations are applied by hand in the Supabase
 * SQL editor — this names the files to run instead of surfacing a raw
 * PostgREST error.
 */
function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        Achievements
      </h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0011_achievements.sql
          </code>{" "}
          in the Supabase SQL editor — it creates the{" "}
          <code className="text-foreground-muted">achievements_section</code>{" "}
          and <code className="text-foreground-muted">achievements</code> tables
          and seeds the section copy. Follow it with{" "}
          <code className="text-foreground-muted">
            0011_achievements_demo_seed.sql
          </code>{" "}
          if you want the six placeholder certificates to edit rather than a
          blank wall. Until then the public section renders the seeded copy from{" "}
          <code className="text-foreground-muted">
            features/achievements/data.ts
          </code>
          .
        </p>
      </div>
    </div>
  );
}

export default async function AdminAchievementsPage() {
  const result = await getAdminAchievements();

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return (
    <AchievementsEditor
      section={result.section}
      achievements={result.achievements}
    />
  );
}

/**
 * Shown when the Projects tables aren't there yet.
 *
 * There is no database connection string locally, so migrations are applied by
 * hand in the Supabase SQL editor — this tells the admin exactly which file to
 * run instead of surfacing a raw PostgREST error.
 */
export function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Projects</h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0004_projects.sql
          </code>{" "}
          in the Supabase SQL editor — it creates the{" "}
          <code className="text-foreground-muted">projects</code> and{" "}
          <code className="text-foreground-muted">project_images</code> tables
          plus the <code className="text-foreground-muted">media</code> storage
          bucket. Until then the public section renders the sample project from{" "}
          <code className="text-foreground-muted">
            features/projects/projects.ts
          </code>
          .
        </p>
      </div>
    </div>
  );
}

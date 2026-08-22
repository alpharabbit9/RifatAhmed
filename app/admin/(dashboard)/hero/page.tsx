import { getAdminProfile } from "@/features/hero/data";
import { getResumeUrl } from "@/features/footer/data";
import { HeroEditor } from "./hero-editor";

export const dynamic = "force-dynamic";

/**
 * Shown when the `profile` table isn't there yet. There is no database
 * connection string locally, so migrations are applied by hand in the Supabase
 * SQL editor — this names the file to run instead of surfacing a raw PostgREST
 * error.
 */
function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Hero</h1>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">
          Couldn&apos;t load this section: {message}
        </p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0010_profile.sql
          </code>{" "}
          in the Supabase SQL editor — it creates the{" "}
          <code className="text-foreground-muted">profile</code> table (the
          singleton row that also backs the footer&apos;s CV link) and seeds it
          with the copy the hero currently shows. Until then the public hero
          renders the defaults in{" "}
          <code className="text-foreground-muted">features/hero/data.ts</code>.
        </p>
      </div>
    </div>
  );
}

export default async function AdminHeroPage() {
  const [result, resumeUrl] = await Promise.all([
    getAdminProfile(),
    getResumeUrl(),
  ]);

  if (!result.ok) {
    return <MigrationNotice message={result.error} />;
  }

  return <HeroEditor profile={result.profile} resumeUrl={resumeUrl} />;
}

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_ABOUT,
  type AboutContent,
  type EducationEntry,
  type SkillGroup,
} from "@/features/about/data";
import { AboutEditor } from "./about-editor";

export const dynamic = "force-dynamic";

function MigrationNotice({ message }: { message: string }) {
  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">
        About &amp; Tech Stack
      </h1>
      <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
        <p className="text-sm text-primary">Couldn&apos;t load this section: {message}</p>
        <p className="mt-2 text-sm text-foreground-subtle">
          If this is the first run, apply{" "}
          <code className="text-foreground-muted">
            supabase/migrations/0002_about_and_skills.sql
          </code>{" "}
          in the Supabase SQL editor. Until then the public site renders the
          seeded copy from{" "}
          <code className="text-foreground-muted">features/about/data.ts</code>.
        </p>
      </div>
    </div>
  );
}

export default async function AdminAboutPage() {
  const supabase = await createClient();

  const [aboutResult, educationResult, groupsResult] = await Promise.all([
    supabase
      .from("about")
      .select(
        "id, eyebrow, heading, body, stack_eyebrow, stack_heading, stack_body",
      )
      .limit(1)
      .maybeSingle(),
    supabase
      .from("education")
      .select("id, degree, institution, timeframe, note, display_order")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("skill_groups")
      .select(
        "id, slug, title, summary, icon_name, display_order, skills(id, label, display_order)",
      )
      .order("display_order", { ascending: true })
      .order("display_order", { referencedTable: "skills", ascending: true }),
  ]);

  const failure =
    aboutResult.error ?? educationResult.error ?? groupsResult.error;

  if (failure) {
    return <MigrationNotice message={failure.message} />;
  }

  // No row yet (migration applied without the seed) — pre-fill the form with
  // the same defaults the public site falls back to, so saving adopts them.
  const about: AboutContent = aboutResult.data
    ? (aboutResult.data as AboutContent)
    : DEFAULT_ABOUT;

  return (
    <AboutEditor
      about={about}
      education={(educationResult.data ?? []) as EducationEntry[]}
      groups={(groupsResult.data ?? []) as SkillGroup[]}
    />
  );
}

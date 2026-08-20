import { createClient } from "@/lib/supabase/server";
import { getResumeUrl, type SocialLink } from "@/features/footer/data";
import { FooterEditor } from "./footer-editor";

export const dynamic = "force-dynamic";

export default async function AdminFooterPage() {
  const supabase = await createClient();

  const [{ data, error }, resumeUrl] = await Promise.all([
    supabase
      .from("social_links")
      .select("id, platform, url, display_order")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getResumeUrl(),
  ]);

  if (error) {
    return (
      <div>
        <p className="label-overline">Site</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Footer</h1>
        <div className="mt-6 rounded-[18px] border border-border bg-surface p-6">
          <p className="text-sm text-primary">
            Couldn&apos;t load social links: {error.message}
          </p>
          <p className="mt-2 text-sm text-foreground-subtle">
            If this is the first run, apply{" "}
            <code className="text-foreground-muted">
              supabase/migrations/0008_social_links_and_resume.sql
            </code>{" "}
            in the Supabase SQL editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FooterEditor
      socials={(data ?? []) as SocialLink[]}
      resumeUrl={resumeUrl}
    />
  );
}

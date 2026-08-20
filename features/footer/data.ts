/**
 * Phase 8 — Footer read helpers (server-side).
 *
 * Kept out of `lib/actions/footer.ts` on purpose: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components.
 */

import { createClient } from "@/lib/supabase/server";

export const RESUME_BUCKET = "resume";
/** Fixed key (upserted) so the public URL is stable and needs no DB column. */
export const RESUME_OBJECT_KEY = "rifat-ahmed-resume.pdf";

export type SocialLink = {
  id: string;
  platform: string;
  url: string;
  display_order: number;
};

export async function getSocialLinks(): Promise<SocialLink[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_links")
    .select("id, platform, url, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    // Most likely the migration hasn't been applied yet — render an empty
    // footer column rather than blowing up the whole page.
    console.error("[footer] social_links read failed:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Resolves the downloadable CV, preferring `profile.resume_file_url` when the
 * Hero/Profile phase has populated it, and otherwise falling back to the
 * fixed object in the `resume` bucket. Returns null when neither exists.
 */
export async function getResumeUrl(): Promise<string | null> {
  const supabase = await createClient();

  // `profile` is owned by the Hero phase and may not exist yet — a failure
  // here is expected, not exceptional.
  const { data: profile } = await supabase
    .from("profile")
    .select("resume_file_url")
    .limit(1)
    .maybeSingle();

  const fromProfile = profile?.resume_file_url;
  if (typeof fromProfile === "string" && fromProfile.length > 0) {
    return fromProfile;
  }

  const { data: files, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .list("", { limit: 100 });

  if (error || !files) {
    return null;
  }

  const file = files.find((entry) => entry.name === RESUME_OBJECT_KEY);
  if (!file) {
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(RESUME_OBJECT_KEY);

  // Cache-bust so a re-upload is picked up immediately.
  const version = file.updated_at ?? file.created_at;
  return version
    ? `${publicUrl}?v=${encodeURIComponent(version)}`
    : publicUrl;
}

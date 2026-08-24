"use server";

/**
 * Phase 7 — Achievements admin mutations (section copy + the certificates).
 *
 * All admin-only. RLS blocks anonymous writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 *
 * The scan itself never travels through here — it is uploaded straight to
 * Supabase Storage from the browser (`features/achievements/upload.ts`), so
 * what arrives is only the resulting public URL and storage key. What this
 * module does own is keeping the bucket in step with the table: a replaced or
 * deleted certificate takes its old object with it.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fromMonthInput,
  MAX_ACHIEVEMENTS,
  MAX_TITLE_LENGTH,
  MEDIA_BUCKET,
} from "@/features/achievements/constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  return supabase;
}

function refreshAchievements() {
  revalidatePath("/");
  revalidatePath("/admin/achievements");
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Normalises CRLF so line-splitting behaves the same on every platform. */
function readMultiline(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

/**
 * Removes a storage object once its row no longer references it. A failure is
 * logged rather than surfaced: the database is already consistent, and an
 * orphaned file is not worth failing the admin's save over.
 */
async function removeCertificateObject(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  path: string | null,
) {
  if (!path) return;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("[achievements] scan cleanup failed:", error.message);
  }
}

/* -------------------------------------------------------------------------- */
/* Section copy (singleton)                                                   */
/* -------------------------------------------------------------------------- */

export async function updateAchievementsSection(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const heading = readField(formData, "heading");
  const accent = readField(formData, "heading_accent");

  const payload = {
    eyebrow: readField(formData, "eyebrow"),
    heading,
    // Stored as typed. An accent that no longer occurs in the heading simply
    // stops highlighting (see `splitHeadingAccent`) — it is a design nicety,
    // not a reason to reject the admin's copy edit.
    heading_accent: accent,
    standfirst: readMultiline(formData, "standfirst"),
    updated_at: new Date().toISOString(),
  };

  if (!payload.eyebrow) {
    return { ok: false, error: "The eyebrow label can't be empty." };
  }
  if (!payload.heading) {
    return { ok: false, error: "The display heading can't be empty." };
  }

  // Singleton: update the existing row, insert the first one if absent.
  const { data: existing, error: readError } = await supabase
    .from("achievements_section")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = existing?.id
    ? await supabase
        .from("achievements_section")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("achievements_section").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAchievements();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Certificates                                                               */
/* -------------------------------------------------------------------------- */

type AchievementValues = {
  title: string;
  issuer: string;
  category: string;
  issued_on: string | null;
  credential_url: string;
  image_url: string | null;
  image_storage_path: string | null;
};

function readAchievement(
  formData: FormData,
): { ok: true; values: AchievementValues } | { ok: false; error: string } {
  const title = readField(formData, "title");

  if (!title) {
    return { ok: false, error: "A certificate needs a title." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Titles are capped at ${MAX_TITLE_LENGTH} characters.`,
    };
  }

  const credentialUrl = readField(formData, "credential_url");
  if (credentialUrl && !/^https?:\/\//i.test(credentialUrl)) {
    return {
      ok: false,
      error: "The credential link needs to start with http:// or https://.",
    };
  }

  const imageUrl = readField(formData, "image_url");

  return {
    ok: true,
    values: {
      title,
      issuer: readField(formData, "issuer"),
      category: readField(formData, "category"),
      issued_on: fromMonthInput(readField(formData, "issued_on")),
      credential_url: credentialUrl,
      image_url: imageUrl || null,
      // Only an uploaded scan carries a storage key — a URL typed by hand has
      // nothing in the bucket to clean up, and must not claim someone else's.
      image_storage_path: imageUrl
        ? readField(formData, "image_storage_path") || null
        : null,
    },
  };
}

export async function createAchievement(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readAchievement(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const { count, error: countError } = await supabase
    .from("achievements")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return { ok: false, error: countError.message };
  }

  if ((count ?? 0) >= MAX_ACHIEVEMENTS) {
    return {
      ok: false,
      error: `That's ${MAX_ACHIEVEMENTS} certificates — the wall stops reading as a gallery past this. Delete one before adding another.`,
    };
  }

  // New certificates hang at the end of the wall: the order on screen is a
  // deliberate sequence, and a new one shouldn't jump to the front.
  const { error } = await supabase
    .from("achievements")
    .insert({ ...parsed.values, display_order: count ?? 0 });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAchievements();
  return { ok: true };
}

export async function updateAchievement(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readAchievement(formData);
  if (!parsed.ok) {
    return parsed;
  }

  // Read the old key before overwriting the row, so a replaced (or cleared)
  // scan can be removed from the bucket afterwards.
  const { data: existing, error: readError } = await supabase
    .from("achievements")
    .select("image_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = await supabase
    .from("achievements")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const previousPath = (existing?.image_storage_path as string | null) ?? null;
  if (previousPath && previousPath !== parsed.values.image_storage_path) {
    await removeCertificateObject(supabase, previousPath);
  }

  refreshAchievements();
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data: existing, error: readError } = await supabase
    .from("achievements")
    .select("image_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = await supabase.from("achievements").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeCertificateObject(
    supabase,
    (existing?.image_storage_path as string | null) ?? null,
  );

  refreshAchievements();
  return { ok: true };
}

/**
 * Swaps a certificate with its neighbour, then rewrites the whole wall to a
 * dense 0..n-1 order so repeated moves can't wedge on duplicate order values.
 */
export async function moveAchievement(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data, error: readError } = await supabase
    .from("achievements")
    .select("id, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const rows = data ?? [];
  if (rows.length < 2) {
    return { ok: true };
  }

  const index = rows.findIndex((row) => row.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= rows.length) {
    return { ok: true }; // Already at the edge — a no-op, not an error.
  }

  const reordered = [...rows];
  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];

  for (const [position, row] of reordered.entries()) {
    const { error } = await supabase
      .from("achievements")
      .update({ display_order: position })
      .eq("id", row.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  refreshAchievements();
  return { ok: true };
}

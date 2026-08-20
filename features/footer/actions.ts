"use server";

/**
 * Phase 8 — Footer admin mutations (social links + resume file).
 *
 * All admin-only. RLS blocks anon writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { RESUME_BUCKET, RESUME_OBJECT_KEY } from "@/features/footer/data";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB

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

function refreshFooter() {
  revalidatePath("/");
  revalidatePath("/admin/footer");
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts full URLs plus the `mailto:`/`tel:` schemes the footer links out to. */
function normalizeUrl(raw: string): string | null {
  if (!raw) return null;

  const candidate = /^(https?:|mailto:|tel:)/i.test(raw)
    ? raw
    : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Social links                                                               */
/* -------------------------------------------------------------------------- */

export async function createSocialLink(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const platform = readField(formData, "platform");
  const url = normalizeUrl(readField(formData, "url"));

  if (!platform) {
    return { ok: false, error: "Platform name is required." };
  }
  if (!url) {
    return { ok: false, error: "Enter a valid URL, mailto: or tel: link." };
  }

  // Append to the end of the current order.
  const { data: last } = await supabase
    .from("social_links")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (last?.display_order ?? -1) + 1;

  const { error } = await supabase
    .from("social_links")
    .insert({ platform, url, display_order: nextOrder });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshFooter();
  return { ok: true };
}

export async function updateSocialLink(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const platform = readField(formData, "platform");
  const url = normalizeUrl(readField(formData, "url"));

  if (!platform) {
    return { ok: false, error: "Platform name is required." };
  }
  if (!url) {
    return { ok: false, error: "Enter a valid URL, mailto: or tel: link." };
  }

  const { error } = await supabase
    .from("social_links")
    .update({ platform, url })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshFooter();
  return { ok: true };
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("social_links").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshFooter();
  return { ok: true };
}

/**
 * Swaps a link with its neighbour. Reads the full ordered list first because
 * `display_order` values may be sparse after deletions.
 */
export async function moveSocialLink(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data: links, error: readError } = await supabase
    .from("social_links")
    .select("id, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (readError) {
    return { ok: false, error: readError.message };
  }
  if (!links || links.length < 2) {
    return { ok: true };
  }

  const index = links.findIndex((link) => link.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || targetIndex < 0 || targetIndex >= links.length) {
    return { ok: true }; // Already at the edge — a no-op, not an error.
  }

  // Rewrite the whole list to a dense 0..n-1 order with the two swapped, so
  // repeated moves can't wedge on duplicate order values.
  const reordered = [...links];
  [reordered[index], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[index],
  ];

  for (const [position, link] of reordered.entries()) {
    const { error } = await supabase
      .from("social_links")
      .update({ display_order: position })
      .eq("id", link.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  refreshFooter();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Resume                                                                     */
/* -------------------------------------------------------------------------- */

export async function uploadResume(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const file = formData.get("resume");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PDF to upload." };
  }
  if (file.type !== "application/pdf") {
    return { ok: false, error: "The resume must be a PDF." };
  }
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: "That PDF is larger than 10 MB." };
  }

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(RESUME_OBJECT_KEY, file, {
      upsert: true,
      contentType: "application/pdf",
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  // Mirror the URL onto `profile` when the Hero phase has created that table.
  // Failure is fine — `getResumeUrl()` falls back to the storage object.
  const {
    data: { publicUrl },
  } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(RESUME_OBJECT_KEY);

  const { data: profile } = await supabase
    .from("profile")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profile?.id) {
    await supabase
      .from("profile")
      .update({ resume_file_url: publicUrl })
      .eq("id", profile.id);
  }

  refreshFooter();
  return { ok: true };
}

export async function deleteResume(): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .remove([RESUME_OBJECT_KEY]);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profile")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profile?.id) {
    await supabase
      .from("profile")
      .update({ resume_file_url: null })
      .eq("id", profile.id);
  }

  refreshFooter();
  return { ok: true };
}

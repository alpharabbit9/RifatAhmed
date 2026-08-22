"use server";

/**
 * Phase 1 — Hero / Profile admin mutations.
 *
 * One singleton row, so there is a single action: save the whole form. Admin
 * only — RLS blocks anonymous writes regardless, but the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 *
 * Images arrive as URL + storage key (uploaded straight from the browser by
 * `features/hero/upload.ts`); this file's remaining job for them is deleting
 * the superseded object once the new row is safely saved.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_NAME_LINES,
  MAX_QUOTE_WORDS,
  MAX_ROLE_LABELS,
  MEDIA_BUCKET,
} from "@/features/hero/constants";

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

function refreshHero() {
  revalidatePath("/");
  revalidatePath("/admin/hero");
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

/** Textarea → one entry per non-blank line. */
function readLines(formData: FormData, key: string, limit: number): string[] {
  return readMultiline(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * CTA destinations are in-page anchors by default but may be absolute links
 * (a hosted CV, a Calendly page), so both shapes have to survive. Anything
 * else — `javascript:` in particular — is rejected rather than silently kept.
 */
function normalizeHref(raw: string): string | null {
  if (!raw) return null;
  if (raw.startsWith("#") || raw.startsWith("/")) return raw;

  const candidate = /^(https?:|mailto:|tel:)/i.test(raw) ? raw : `https://${raw}`;

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

/**
 * A URL the admin typed by hand (or a `/images/…` file that ships with the
 * repo) has no storage key — only uploads do, and only those can be cleaned
 * up. Clearing the image clears the key with it.
 */
function readImage(formData: FormData, kind: string) {
  const url = readField(formData, `${kind}_url`) || null;
  return {
    url,
    storage_path: url ? readField(formData, `${kind}_storage_path`) || null : null,
  };
}

/**
 * Removes a storage object once the row no longer references it. A failure is
 * logged rather than surfaced: the database is already consistent, and an
 * orphaned file is not worth failing the admin's save over.
 */
async function removeMediaObject(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  path: string | null,
) {
  if (!path) return;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("[hero] image cleanup failed:", error.message);
  }
}

/* -------------------------------------------------------------------------- */
/* Save (singleton)                                                           */
/* -------------------------------------------------------------------------- */

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const name = readLines(formData, "name", MAX_NAME_LINES).join("\n");
  if (!name) {
    return { ok: false, error: "The name can't be empty." };
  }

  const ctaLabel = readField(formData, "cta_label");
  const ctaHref = normalizeHref(readField(formData, "cta_href"));
  if (ctaLabel && !ctaHref) {
    return {
      ok: false,
      error: "Give the primary button a valid link, or clear its label to hide it.",
    };
  }

  const contactLabel = readField(formData, "contact_cta_label");
  const contactHref = normalizeHref(readField(formData, "contact_cta_href"));
  if (contactLabel && !contactHref) {
    return {
      ok: false,
      error: "Give the contact button a valid link, or clear its label to hide it.",
    };
  }

  const portrait = readImage(formData, "portrait");
  const artwork = readImage(formData, "artwork");
  const logo = readImage(formData, "logo");

  const payload = {
    name,
    role_labels: readLines(formData, "role_labels", MAX_ROLE_LABELS),
    tagline: readMultiline(formData, "tagline"),
    bio: readMultiline(formData, "bio"),
    quote_words: readLines(formData, "quote_words", MAX_QUOTE_WORDS),
    connect_label: readField(formData, "connect_label"),
    cta_label: ctaLabel,
    // Kept even when the label is blank, so re-enabling a button doesn't mean
    // retyping its destination.
    cta_href: ctaHref ?? "#projects",
    contact_cta_label: contactLabel,
    contact_cta_href: contactHref ?? "#contact",
    resume_cta_label: readField(formData, "resume_cta_label"),
    portrait_image_url: portrait.url,
    portrait_storage_path: portrait.storage_path,
    artwork_image_url: artwork.url,
    artwork_storage_path: artwork.storage_path,
    logo_url: logo.url,
    logo_storage_path: logo.storage_path,
    updated_at: new Date().toISOString(),
  };

  // Singleton: update the existing row, insert the first one if absent.
  const { data: existing, error: readError } = await supabase
    .from("profile")
    .select("id, portrait_storage_path, artwork_storage_path, logo_storage_path")
    .limit(1)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = existing?.id
    ? await supabase.from("profile").update(payload).eq("id", existing.id)
    : await supabase.from("profile").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  // The row is saved; any replaced image's file is now unreferenced.
  const replaced: Array<[string | null, string | null]> = [
    [existing?.portrait_storage_path ?? null, portrait.storage_path],
    [existing?.artwork_storage_path ?? null, artwork.storage_path],
    [existing?.logo_storage_path ?? null, logo.storage_path],
  ];

  for (const [previous, next] of replaced) {
    if (previous && previous !== next) {
      await removeMediaObject(supabase, previous);
    }
  }

  refreshHero();
  return { ok: true };
}

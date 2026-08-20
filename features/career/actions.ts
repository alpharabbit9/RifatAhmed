"use server";

/**
 * Phase 5 — Career Journey admin mutations (section copy + timeline entries).
 *
 * All admin-only. RLS blocks anonymous writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 *
 * Logo *files* are uploaded straight from the browser (see `upload.ts`) — what
 * arrives here is only the resulting public URL and storage key. This module
 * owns the other half of that deal: deleting the object once nothing points at
 * it any more.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fromMonthInput,
  MAX_HIGHLIGHTS,
  MAX_SKILLS,
  MEDIA_BUCKET,
} from "@/features/career/constants";

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

function refreshCareer() {
  revalidatePath("/");
  revalidatePath("/admin/career-journey");
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

/** Comma- or newline-separated input → a de-duplicated list. */
function readTags(formData: FormData, key: string, limit: number): string[] {
  const seen = new Set<string>();

  return readMultiline(formData, key)
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag) return false;
      const lower = tag.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .slice(0, limit);
}

/** Accepts a bare domain; rejects anything that isn't http(s). */
function normalizeUrl(raw: string): string | null {
  if (!raw) return null;

  const candidate = /^https?:/i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

/**
 * Removes a storage object once its row no longer references it. A failure is
 * logged rather than surfaced: the database is already consistent, and an
 * orphaned file is not worth failing the admin's save over.
 */
async function removeLogoObject(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  path: string | null,
) {
  if (!path) return;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("[career] logo cleanup failed:", error.message);
  }
}

/* -------------------------------------------------------------------------- */
/* Section copy (singleton)                                                   */
/* -------------------------------------------------------------------------- */

export async function updateCareerSection(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const payload = {
    eyebrow: readField(formData, "eyebrow"),
    heading: readField(formData, "heading"),
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
    .from("career_section")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = existing?.id
    ? await supabase.from("career_section").update(payload).eq("id", existing.id)
    : await supabase.from("career_section").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshCareer();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Entries                                                                    */
/* -------------------------------------------------------------------------- */

type EntryValues = {
  role: string;
  company: string;
  company_url: string | null;
  employment_type: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  highlights: string[];
  skills: string[];
  logo_url: string | null;
  logo_storage_path: string | null;
};

function readEntry(
  formData: FormData,
): { ok: true; values: EntryValues } | { ok: false; error: string } {
  const role = readField(formData, "role");
  const company = readField(formData, "company");

  if (!role || !company) {
    return { ok: false, error: "Role and company are both required." };
  }

  const rawUrl = readField(formData, "company_url");
  const company_url = rawUrl ? normalizeUrl(rawUrl) : null;

  if (rawUrl && !company_url) {
    return { ok: false, error: "Enter a valid company URL, or leave it blank." };
  }

  const start_date = fromMonthInput(readField(formData, "start_date"));
  // The "I currently work here" checkbox wins over whatever the (disabled)
  // end-date input last held.
  const isCurrent = formData.get("is_current") === "on";
  const end_date = isCurrent
    ? null
    : fromMonthInput(readField(formData, "end_date"));

  if (start_date && end_date && end_date < start_date) {
    return { ok: false, error: "The end date can't be before the start date." };
  }

  const logo_url = readField(formData, "logo_url") || null;

  return {
    ok: true,
    values: {
      role,
      company,
      company_url,
      employment_type: readField(formData, "employment_type"),
      location: readField(formData, "location"),
      start_date,
      end_date,
      description: readMultiline(formData, "description"),
      highlights: readLines(formData, "highlights", MAX_HIGHLIGHTS),
      skills: readTags(formData, "skills", MAX_SKILLS),
      logo_url,
      // A logo the admin typed in by hand (or the seeded /public path) has no
      // storage key — only uploads do, and only those can be cleaned up.
      logo_storage_path: logo_url
        ? readField(formData, "logo_storage_path") || null
        : null,
    },
  };
}

export async function createCareerEntry(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readEntry(formData);
  if (!parsed.ok) {
    return parsed;
  }

  // New roles are the most recent, so they go to the top of the timeline and
  // everything below shifts down one.
  const { data: rows, error: readError } = await supabase
    .from("career_journey")
    .select("id")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = await supabase
    .from("career_journey")
    .insert({ ...parsed.values, display_order: 0 });

  if (error) {
    return { ok: false, error: error.message };
  }

  for (const [index, row] of (rows ?? []).entries()) {
    const { error: shiftError } = await supabase
      .from("career_journey")
      .update({ display_order: index + 1 })
      .eq("id", row.id);

    if (shiftError) {
      return { ok: false, error: shiftError.message };
    }
  }

  refreshCareer();
  return { ok: true };
}

export async function updateCareerEntry(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readEntry(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const { data: existing } = await supabase
    .from("career_journey")
    .select("logo_storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("career_journey")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  // The row is saved; a replaced logo's file is now unreferenced.
  const previousPath = (existing?.logo_storage_path as string | null) ?? null;
  if (previousPath && previousPath !== parsed.values.logo_storage_path) {
    await removeLogoObject(supabase, previousPath);
  }

  refreshCareer();
  return { ok: true };
}

export async function deleteCareerEntry(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data: existing } = await supabase
    .from("career_journey")
    .select("logo_storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("career_journey").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await removeLogoObject(
    supabase,
    (existing?.logo_storage_path as string | null) ?? null,
  );

  refreshCareer();
  return { ok: true };
}

/**
 * Swaps an entry with its neighbour, then rewrites the whole list to a dense
 * 0..n-1 order so repeated moves can't wedge on duplicate order values.
 */
export async function moveCareerEntry(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data, error: readError } = await supabase
    .from("career_journey")
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
      .from("career_journey")
      .update({ display_order: position })
      .eq("id", row.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  refreshCareer();
  return { ok: true };
}

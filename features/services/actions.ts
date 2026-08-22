"use server";

/**
 * Phase 6 — Services admin mutations (section copy + the offers themselves).
 *
 * All admin-only. RLS blocks anonymous writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 *
 * Nothing here uploads: a service is text and an icon key, so unlike the
 * career timeline there is no storage object to keep in step with the row.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_DELIVERABLES,
  MAX_SERVICES,
  MAX_TITLE_LENGTH,
} from "@/features/services/constants";
import { isServiceIconName } from "@/features/services/icons";

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

function refreshServices() {
  revalidatePath("/");
  revalidatePath("/admin/services");
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

/* -------------------------------------------------------------------------- */
/* Section copy (singleton)                                                   */
/* -------------------------------------------------------------------------- */

export async function updateServicesSection(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const ctaLabel = readField(formData, "cta_label");
  const ctaHref = readField(formData, "cta_href");

  if (ctaLabel && !ctaHref) {
    return {
      ok: false,
      error: "Give the button a link, or clear its label to hide it.",
    };
  }

  const payload = {
    eyebrow: readField(formData, "eyebrow"),
    heading: readField(formData, "heading"),
    standfirst: readMultiline(formData, "standfirst"),
    cta_note: readMultiline(formData, "cta_note"),
    cta_label: ctaLabel,
    // Kept even when the label is blank, so re-enabling the button doesn't
    // mean retyping the destination.
    cta_href: ctaHref || "#contact",
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
    .from("services_section")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = existing?.id
    ? await supabase
        .from("services_section")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("services_section").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshServices();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

type ServiceValues = {
  title: string;
  summary: string;
  icon_name: string;
  deliverables: string[];
};

function readService(
  formData: FormData,
): { ok: true; values: ServiceValues } | { ok: false; error: string } {
  const title = readField(formData, "title");

  if (!title) {
    return { ok: false, error: "A service needs a title." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Titles are capped at ${MAX_TITLE_LENGTH} characters.`,
    };
  }

  // An icon the form didn't offer (or a stale key) falls back rather than
  // failing the save — the public side degrades to the same neutral glyph.
  const icon = readField(formData, "icon_name");

  return {
    ok: true,
    values: {
      title,
      summary: readMultiline(formData, "summary"),
      icon_name: isServiceIconName(icon) ? icon : "sparkles",
      deliverables: readLines(formData, "deliverables", MAX_DELIVERABLES),
    },
  };
}

export async function createService(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readService(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const { count, error: countError } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return { ok: false, error: countError.message };
  }

  if ((count ?? 0) >= MAX_SERVICES) {
    return {
      ok: false,
      error: `That's ${MAX_SERVICES} services — delete one before adding another.`,
    };
  }

  // New services go to the bottom of the list: the order on screen is a
  // deliberate pitch, and a new offer shouldn't jump the queue.
  const { error } = await supabase
    .from("services")
    .insert({ ...parsed.values, display_order: count ?? 0 });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshServices();
  return { ok: true };
}

export async function updateService(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const parsed = readService(formData);
  if (!parsed.ok) {
    return parsed;
  }

  const { error } = await supabase
    .from("services")
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshServices();
  return { ok: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshServices();
  return { ok: true };
}

/**
 * Swaps a service with its neighbour, then rewrites the whole list to a dense
 * 0..n-1 order so repeated moves can't wedge on duplicate order values.
 */
export async function moveService(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { data, error: readError } = await supabase
    .from("services")
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
      .from("services")
      .update({ display_order: position })
      .eq("id", row.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  refreshServices();
  return { ok: true };
}

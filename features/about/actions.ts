"use server";

/**
 * Phase 2 — About Me admin mutations (copy, education, skill groups, skills).
 *
 * All admin-only. RLS blocks anonymous writes regardless; the explicit session
 * check makes an unauthenticated call fail with a clear error instead of a
 * confusing zero-row result.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSkillIconName } from "@/features/about/icons";

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

function refreshAbout() {
  revalidatePath("/");
  revalidatePath("/admin/about");
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Normalises CRLF so `\n\n` paragraph splitting behaves the same everywhere. */
function readMultiline(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
}

type OrderedRow = { id: string; display_order: number };

/**
 * Swaps a row with its neighbour, then rewrites the whole list to a dense
 * 0..n-1 order so repeated moves can't wedge on duplicate order values.
 * Shared by education, skill groups and skills.
 */
async function reorder(
  table: "education" | "skill_groups" | "skills",
  id: string,
  direction: "up" | "down",
  scope?: { column: string; value: string },
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  let query = supabase
    .from(table)
    .select("id, display_order")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (scope) {
    query = query.eq(scope.column, scope.value);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: error.message };
  }

  const rows = (data ?? []) as OrderedRow[];
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
    const { error: updateError } = await supabase
      .from(table)
      .update({ display_order: position })
      .eq("id", row.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  }

  refreshAbout();
  return { ok: true };
}

/** Next position at the end of a list (orders may be sparse after deletes). */
async function nextOrder(
  supabase: Awaited<ReturnType<typeof requireAdmin>>,
  table: "education" | "skill_groups" | "skills",
  scope?: { column: string; value: string },
): Promise<number> {
  let query = supabase
    .from(table)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  if (scope) {
    query = query.eq(scope.column, scope.value);
  }

  const { data } = await query.maybeSingle();
  return ((data?.display_order as number | undefined) ?? -1) + 1;
}

/* -------------------------------------------------------------------------- */
/* About copy (singleton)                                                     */
/* -------------------------------------------------------------------------- */

export async function updateAbout(formData: FormData): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const payload = {
    eyebrow: readField(formData, "eyebrow"),
    heading: readMultiline(formData, "heading"),
    body: readMultiline(formData, "body"),
    stack_eyebrow: readField(formData, "stack_eyebrow"),
    stack_heading: readField(formData, "stack_heading"),
    stack_body: readMultiline(formData, "stack_body"),
    updated_at: new Date().toISOString(),
  };

  if (!payload.heading) {
    return { ok: false, error: "The display heading can't be empty." };
  }
  if (!payload.body) {
    return { ok: false, error: "The about copy can't be empty." };
  }
  if (!payload.stack_heading) {
    return { ok: false, error: "The tech stack heading can't be empty." };
  }

  // Singleton: update the existing row, insert the first one if absent.
  const { data: existing, error: readError } = await supabase
    .from("about")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  const { error } = existing?.id
    ? await supabase.from("about").update(payload).eq("id", existing.id)
    : await supabase.from("about").insert(payload);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Education                                                                  */
/* -------------------------------------------------------------------------- */

function readEducation(formData: FormData) {
  return {
    degree: readField(formData, "degree"),
    institution: readField(formData, "institution"),
    timeframe: readField(formData, "timeframe") || null,
    note: readMultiline(formData, "note") || null,
  };
}

export async function createEducation(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const values = readEducation(formData);

  if (!values.degree || !values.institution) {
    return { ok: false, error: "Degree and institution are both required." };
  }

  const { error } = await supabase.from("education").insert({
    ...values,
    display_order: await nextOrder(supabase, "education"),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function updateEducation(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();
  const values = readEducation(formData);

  if (!values.degree || !values.institution) {
    return { ok: false, error: "Degree and institution are both required." };
  }

  const { error } = await supabase
    .from("education")
    .update(values)
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function deleteEducation(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("education").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function moveEducation(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return reorder("education", id, direction);
}

/* -------------------------------------------------------------------------- */
/* Skill groups                                                               */
/* -------------------------------------------------------------------------- */

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "group"
  );
}

export async function createSkillGroup(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const title = readField(formData, "title");
  const summary = readMultiline(formData, "summary") || null;
  const iconInput = readField(formData, "icon_name");
  const icon_name = isSkillIconName(iconInput) ? iconInput : "sparkles";

  if (!title) {
    return { ok: false, error: "A group title is required." };
  }

  // `slug` is unique — suffix it until it lands.
  const base = slugify(title);
  const { data: taken } = await supabase
    .from("skill_groups")
    .select("slug")
    .like("slug", `${base}%`);

  const used = new Set((taken ?? []).map((row) => row.slug as string));
  let slug = base;
  for (let n = 2; used.has(slug); n += 1) {
    slug = `${base}-${n}`;
  }

  const { error } = await supabase.from("skill_groups").insert({
    slug,
    title,
    summary,
    icon_name,
    display_order: await nextOrder(supabase, "skill_groups"),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function updateSkillGroup(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const title = readField(formData, "title");
  const summary = readMultiline(formData, "summary") || null;
  const iconInput = readField(formData, "icon_name");

  if (!title) {
    return { ok: false, error: "A group title is required." };
  }

  const { error } = await supabase
    .from("skill_groups")
    .update({
      title,
      summary,
      icon_name: isSkillIconName(iconInput) ? iconInput : "sparkles",
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

/** Cascades to the group's skills (FK is `on delete cascade`). */
export async function deleteSkillGroup(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("skill_groups").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function moveSkillGroup(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return reorder("skill_groups", id, direction);
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export async function createSkill(
  groupId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const label = readField(formData, "label");

  if (!label) {
    return { ok: false, error: "Enter a skill name." };
  }

  const { data: duplicate } = await supabase
    .from("skills")
    .select("id")
    .eq("group_id", groupId)
    .ilike("label", label)
    .maybeSingle();

  if (duplicate) {
    return { ok: false, error: `"${label}" is already in this group.` };
  }

  const { error } = await supabase.from("skills").insert({
    group_id: groupId,
    label,
    display_order: await nextOrder(supabase, "skills", {
      column: "group_id",
      value: groupId,
    }),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function updateSkill(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const label = readField(formData, "label");

  if (!label) {
    return { ok: false, error: "Enter a skill name." };
  }

  const { error } = await supabase
    .from("skills")
    .update({ label })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function deleteSkill(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("skills").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  refreshAbout();
  return { ok: true };
}

export async function moveSkill(
  id: string,
  groupId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return reorder("skills", id, direction, {
    column: "group_id",
    value: groupId,
  });
}

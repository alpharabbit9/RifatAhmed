"use server";

/**
 * Phase 7 — Contact.
 *
 * `submitContactMessage` is public (anon RLS insert policy). Everything else
 * is admin-only: RLS already blocks anon, but each action re-checks the
 * session so an unauthenticated call fails loudly instead of silently
 * matching zero rows.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  CONTACT_INITIAL_STATE,
  type ContactField,
  type ContactFormState,
} from "@/features/contact/state";

/** Deliberately permissive — real addresses beat a clever regex. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  name: { min: 2, max: 120 },
  email: { max: 320 },
  message: { min: 10, max: 5000 },
} as const;

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitContactMessage(
  prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot: hidden from humans, irresistible to naive bots. Pretend it
  // worked so the bot doesn't retune and retry.
  if (readField(formData, "company")) {
    return {
      ...CONTACT_INITIAL_STATE,
      status: "success",
      message: "Thanks — your message is on its way.",
      submissionId: prevState.submissionId + 1,
    };
  }

  const name = readField(formData, "name");
  const email = readField(formData, "email");
  const message = readField(formData, "message");

  const fieldErrors: Partial<Record<ContactField, string>> = {};

  if (name.length < LIMITS.name.min) {
    fieldErrors.name = "Please tell me your name.";
  } else if (name.length > LIMITS.name.max) {
    fieldErrors.name = `Keep this under ${LIMITS.name.max} characters.`;
  }

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "That doesn't look like a valid email address.";
  } else if (email.length > LIMITS.email.max) {
    fieldErrors.email = "That email address is too long.";
  }

  if (message.length < LIMITS.message.min) {
    fieldErrors.message = "A little more detail would help — 10 characters minimum.";
  } else if (message.length > LIMITS.message.max) {
    fieldErrors.message = `Keep this under ${LIMITS.message.max} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
      submissionId: prevState.submissionId,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message });

  if (error) {
    console.error("[contact] insert failed:", error);
    return {
      status: "error",
      message:
        "Something went wrong sending that. Please try again, or email me directly.",
      fieldErrors: {},
      submissionId: prevState.submissionId,
    };
  }

  revalidatePath("/admin/messages");

  return {
    status: "success",
    message: "Thanks — your message landed. I'll get back to you shortly.",
    fieldErrors: {},
    submissionId: prevState.submissionId + 1,
  };
}

/* -------------------------------------------------------------------------- */
/* Admin actions                                                              */
/* -------------------------------------------------------------------------- */

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

export async function setMessageRead(id: string, read: boolean) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("contact_messages")
    .update({ read })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/messages");
  return { ok: true as const };
}

export async function deleteMessage(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/messages");
  return { ok: true as const };
}

export async function markAllMessagesRead() {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("contact_messages")
    .update({ read: true })
    .eq("read", false);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/admin/messages");
  return { ok: true as const };
}

/* -------------------------------------------------------------------------- */
/* Contact details (the `profile` singleton)                                  */
/* -------------------------------------------------------------------------- */

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * The email, phone, address and availability pill printed by the contact
 * section and the footer. They live on `profile` rather than a table of their
 * own — it is the same person's identity as the name and the CV, and one row
 * is what stops the footer and the contact section disagreeing again.
 */
export async function updateContactDetails(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireAdmin();

  const email = readField(formData, "contact_email");
  if (!email) {
    return { ok: false, error: "An email address is required." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "That doesn't look like a valid email address." };
  }
  if (email.length > LIMITS.email.max) {
    return { ok: false, error: "That email address is too long." };
  }

  const payload = {
    contact_email: email,
    // Stored exactly as typed so it reads the way the admin wrote it
    // (+880 1XXX-XXXXXX); only the `tel:` href strips the formatting.
    contact_phone: readField(formData, "contact_phone"),
    contact_location: readField(formData, "contact_location"),
    availability_label: readField(formData, "availability_label"),
    updated_at: new Date().toISOString(),
  };

  // Singleton: update the existing row, insert the first one if absent.
  const { data: existing, error: readError } = await supabase
    .from("profile")
    .select("id")
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

  // The footer prints the email too, and it renders on these routes as well —
  // revalidating only "/" would leave a stale address on the other two.
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/achievements");
  revalidatePath("/admin/contact");

  return { ok: true };
}

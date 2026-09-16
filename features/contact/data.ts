/**
 * Contact details read helpers (server-side).
 *
 * Kept out of `actions.ts` deliberately: everything exported from a
 * "use server" module becomes a callable RPC endpoint, and these are plain
 * reads used by Server Components. The type and the defaults live in
 * `constants.ts` instead of here, because this module imports the Supabase
 * server client and the contact section that needs them is a Client Component.
 *
 * The strings here used to be hardcoded constants in the contact section and
 * the footer — which disagreed about the email address. They now come from the
 * same `profile` singleton the hero reads, so every place on the site that
 * prints an address prints the same one.
 *
 * Reads degrade the way every other section's do: until
 * `supabase/migrations/0012_profile_contact.sql` has been applied by hand the
 * public site renders `DEFAULT_CONTACT`.
 */

import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CONTACT,
  type ContactDetails,
} from "@/features/contact/constants";

export const CONTACT_COLUMNS =
  "contact_email, contact_phone, contact_location, availability_label";

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Blank is a deliberate "hide this", so it is preserved rather than filled. */
function blankable(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normaliseContact(row: Record<string, unknown>): ContactDetails {
  return {
    // The email is the one field that must not be empty: the section's
    // mailto: links and the form's "or reach me directly" line both hang off
    // it, and a blank would render them as dead links.
    email: text(row.contact_email, DEFAULT_CONTACT.email),
    phone: blankable(row.contact_phone),
    location: blankable(row.contact_location),
    availability_label: blankable(row.availability_label),
  };
}

/* -------------------------------------------------------------------------- */
/* Public read                                                                */
/* -------------------------------------------------------------------------- */

export async function getContactDetails(): Promise<ContactDetails> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile")
    .select(CONTACT_COLUMNS)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("[contact] details read failed:", error.message);
    }
    return DEFAULT_CONTACT;
  }

  return normaliseContact(data as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* Admin read                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The admin screen must NOT fall back: editing placeholder content that
 * doesn't exist in the database would silently do nothing. A failure here is
 * surfaced as "apply the migration" instead.
 */
export async function getAdminContactDetails(): Promise<
  { ok: true; contact: ContactDetails } | { ok: false; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile")
    .select(CONTACT_COLUMNS)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    // No row yet (0010 applied without its seed) — pre-fill with the same
    // defaults the public site falls back to, so saving adopts them.
    contact: data
      ? normaliseContact(data as unknown as Record<string, unknown>)
      : DEFAULT_CONTACT,
  };
}

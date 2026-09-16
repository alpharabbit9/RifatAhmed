/**
 * Contact details — shape and defaults.
 *
 * Split out of `data.ts` because that module imports the Supabase server
 * client (and so `next/headers`), which cannot be pulled into a client bundle.
 * The contact section is a Client Component — it owns the form — so the type
 * and the fallbacks it needs live here, exactly as the hero splits
 * `constants.ts` from `data.ts`.
 */

export type ContactDetails = {
  email: string;
  /** Blank hides the phone row — it is opt-in. */
  phone: string;
  /** Blank hides the "Based in" row. */
  location: string;
  /** Blank hides the availability pill. */
  availability_label: string;
};

/* -------------------------------------------------------------------------- */
/* Defaults — mirror the column defaults of migration 0012                    */
/* -------------------------------------------------------------------------- */

/**
 * What the site renders until `0012_profile_contact.sql` has been applied:
 * word-for-word the strings the contact section and the footer used to
 * hardcode, so applying the migration changes nothing on screen. The email is
 * the contact section's real address — the footer's `hello@rifatahmed.dev` was
 * a placeholder that disagreed with it.
 */
export const DEFAULT_CONTACT: ContactDetails = {
  email: "rifatahm033@gmail.com",
  phone: "",
  location: "Dhaka, Bangladesh — working worldwide",
  availability_label: "Available for freelance & full-time",
};

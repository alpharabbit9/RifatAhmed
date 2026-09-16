/**
 * Phase 8 — Footer (Server Component shell).
 *
 * Fetches the admin-managed social links, resume and identity, then hands off
 * to the client component that owns layout and scroll motion.
 *
 * The name, tagline and email are read here rather than passed in because this
 * footer renders on four routes (`/`, `/projects`, `/achievements` and the 404
 * page) and threading the same three strings through every one of them is how
 * they drift apart. They used to be hardcoded constants — the email in
 * particular disagreed with the one the contact section printed.
 */

import { getResumeUrl, getSocialLinks } from "@/features/footer/data";
import { FooterContent } from "@/features/footer/footer-content";
import { getContactDetails } from "@/features/contact/data";
import { getProfile } from "@/features/hero/data";
import { nameLines } from "@/features/hero/constants";

export interface FooterSectionProps {
  /** Overrides for a route that needs to say something different. */
  email?: string;
  name?: string;
  tagline?: string;
}

export async function FooterSection({
  email,
  name,
  tagline,
}: FooterSectionProps = {}) {
  const [socials, resumeUrl, contact, profile] = await Promise.all([
    getSocialLinks(),
    getResumeUrl(),
    getContactDetails(),
    getProfile(),
  ]);

  return (
    <FooterContent
      socials={socials}
      resumeUrl={resumeUrl}
      email={email ?? contact.email}
      // `profile.name` carries one display line per newline for the hero's
      // stacked heading; the footer's marquee is a single line.
      name={name ?? nameLines(profile.name).join(" ")}
      // `bio`, not `tagline`: the footer slot is the descriptive paragraph
      // under the name, which is what `bio` is. `profile.tagline` is the
      // hero's four-word statement and reads as a fragment here.
      tagline={tagline ?? profile.bio}
    />
  );
}

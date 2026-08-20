/**
 * Phase 8 — Footer (Server Component shell).
 *
 * Fetches the admin-managed social links and resume, then hands off to the
 * client component that owns layout and scroll motion.
 */

import { getResumeUrl, getSocialLinks } from "@/features/footer/data";
import { FooterContent } from "@/features/footer/footer-content";

const DEFAULT_EMAIL = "hello@rifatahmed.dev";
const DEFAULT_NAME = "Rifat Ahmed";
const DEFAULT_TAGLINE =
  "Full Stack Developer & AI Agent Builder — building modern web apps, smart automations and meaningful digital experiences.";

export interface FooterSectionProps {
  /** Overridable so a later phase can feed these from `profile` without edits. */
  email?: string;
  name?: string;
  tagline?: string;
}

export async function FooterSection({
  email = DEFAULT_EMAIL,
  name = DEFAULT_NAME,
  tagline = DEFAULT_TAGLINE,
}: FooterSectionProps = {}) {
  const [socials, resumeUrl] = await Promise.all([
    getSocialLinks(),
    getResumeUrl(),
  ]);

  return (
    <FooterContent
      socials={socials}
      resumeUrl={resumeUrl}
      email={email}
      name={name}
      tagline={tagline}
    />
  );
}

/**
 * Phase 1 — Hero (Server Component shell).
 *
 * Fetches the admin-managed profile plus the two things the hero shares with
 * the footer — the social links and the résumé file — then hands off to the
 * client component that owns layout and motion.
 *
 * The socials and the CV are read from the Footer phase's helpers rather than
 * duplicated into `profile`: there is one set of links and one CV on this
 * site, and the hero and the footer must never disagree about either.
 */

import { getResumeUrl, getSocialLinks } from "@/features/footer/data";
import { DEFAULT_SOCIALS, getProfile } from "@/features/hero/data";
import { HeroSectionContent } from "@/features/hero/hero-content";

export async function HeroSection() {
  const [profile, socialLinks, resumeUrl] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getResumeUrl(),
  ]);

  // `social_links` ships with no seed, so an empty list here usually means
  // "migration 0008 not applied yet" rather than a deliberately bare hero.
  const socials =
    socialLinks.length > 0
      ? socialLinks.map(({ id, platform, url }) => ({ id, platform, url }))
      : DEFAULT_SOCIALS;

  return (
    <HeroSectionContent
      profile={profile}
      socials={socials}
      resumeUrl={resumeUrl}
    />
  );
}

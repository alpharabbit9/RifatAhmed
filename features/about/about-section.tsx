/**
 * Phase 2 — About Me (Server Component shell).
 *
 * Fetches the admin-managed copy, education and skill groups in parallel,
 * then hands off to the client component that owns layout and motion.
 */

import {
  getAbout,
  getEducation,
  getSkillGroups,
} from "@/features/about/data";
import { AboutSectionContent } from "@/features/about/about-content";

export async function AboutSection() {
  const [about, education, groups] = await Promise.all([
    getAbout(),
    getEducation(),
    getSkillGroups(),
  ]);

  return (
    <AboutSectionContent
      about={about}
      education={education}
      groups={groups}
    />
  );
}

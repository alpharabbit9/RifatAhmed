/**
 * `/achievements` — the certificate wall, as a page of its own.
 *
 * It used to be a band on the home page. It is a route now because the wall is
 * a collection that grows: a dozen frames is a page's worth of looking, not
 * something to scroll past on the way to the contact form. The navbar links
 * straight here.
 *
 * The route reads the admin-managed section copy, the certificates and the
 * profile in parallel, then hands off to the client component that owns the
 * wall, its lighting and the viewer. Reads fall back to the seeded content
 * when migration 0011 hasn't been applied yet (see `data.ts`).
 *
 * The profile read is what makes the alt text honest: every certificate is
 * described as belonging to whoever `/admin/hero` currently says the site is
 * about, rather than to a name hardcoded in this feature. `profile.name` is
 * stored one display line per newline, so it is flattened back to a sentence
 * here.
 *
 * `getAchievementsSection` is wrapped in React's `cache()` because
 * `generateMetadata` and the page body both need the section copy in the same
 * request — without it the same row would be fetched from Supabase twice.
 */

import { cache } from "react";
import type { Metadata } from "next";
import { NotchNavbar } from "@/components/ui/notch-navbar";
import { AchievementsGallery } from "@/features/achievements/achievements-gallery";
import {
  getAchievements,
  getAchievementsSection,
} from "@/features/achievements/data";
import { FooterSection } from "@/features/footer/footer-section";
import { getProfile } from "@/features/hero/data";
import { SiteLogo } from "@/features/hero/site-logo";
import { toMetaDescription } from "@/lib/site";

const loadSection = cache(getAchievementsSection);

export async function generateMetadata(): Promise<Metadata> {
  const section = await loadSection();

  const description =
    toMetaDescription(section.standfirst) ??
    "Certifications and achievements earned by Rifat Ahmed.";

  return {
    title: "Achievements",
    description,
    alternates: { canonical: "/achievements" },
    openGraph: {
      type: "website",
      url: "/achievements",
      title: "Achievements | Rifat Ahmed",
      description,
    },
  };
}

export default async function AchievementsPage() {
  const [section, achievements, profile] = await Promise.all([
    loadSection(),
    getAchievements(),
    getProfile(),
  ]);

  const holder =
    profile.name
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ") || "Rifat Ahmed";

  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar logo={<SiteLogo />} />
        <AchievementsGallery
          section={section}
          achievements={achievements}
          holder={holder}
        />
      </main>
      <FooterSection />
    </>
  );
}

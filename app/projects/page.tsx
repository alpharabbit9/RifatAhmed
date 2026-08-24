/**
 * `/projects` — the public archive of every published project.
 *
 * The route does one thing: read the published set (no `featuredOnly`, so
 * this is *everything*, not the home page's edit) and hand it to
 * `<ProjectsIndex>`. All layout lives in `features/projects/`.
 *
 * Sibling of `app/projects/[slug]/page.tsx`: this page lists the cards, that
 * one renders the case study behind each of them.
 */

import type { Metadata } from "next";
import { NotchNavbar } from "@/components/ui/notch-navbar";
import { FooterSection } from "@/features/footer/footer-section";
import { SiteLogo } from "@/features/hero/site-logo";
import { getShowcaseProjects } from "@/features/projects/data";
import { ProjectsIndex } from "@/features/projects/projects-index";

const DESCRIPTION =
  "Every project Rifat Ahmed has shipped and written up — full stack web apps, AI agents and automations, each with its own case study.";

// `title` is the page's own name only: the root layout's template appends
// "| Rifat Ahmed". The card image comes from `opengraph-image.tsx` next door.
export const metadata: Metadata = {
  title: "Projects",
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: {
    type: "website",
    url: "/projects",
    title: "Projects | Rifat Ahmed",
    description: DESCRIPTION,
  },
};

export default async function ProjectsPage() {
  const projects = await getShowcaseProjects();

  return (
    <>
      <main className="min-h-screen bg-background">
        <NotchNavbar logo={<SiteLogo />} />
        <ProjectsIndex projects={projects} />
      </main>
      <FooterSection />
    </>
  );
}

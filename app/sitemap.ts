/**
 * Phase 9 — `/sitemap.xml`, generated from the same reads the pages use.
 *
 * The public surface is four kinds of URL: the home page, the project archive,
 * the certificate wall, and one case study per published project. Drafts are
 * excluded for free — `getShowcaseProjects` only ever returns published rows
 * (RLS enforces the same thing server-side), so an unpublished project cannot
 * leak into the sitemap.
 *
 * No `lastModified`: the content lives in Supabase and is edited from `/admin`
 * whenever the owner feels like it, so any timestamp this route could invent
 * would be either a guess or "now" on every crawl. A sitemap without lastmod
 * is valid; one that claims everything changed on every fetch trains crawlers
 * to ignore the field.
 */

import type { MetadataRoute } from "next";
import { getShowcaseProjects } from "@/features/projects/data";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getShowcaseProjects();

  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    {
      url: absoluteUrl("/projects"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/achievements"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...projects.map((project) => ({
      url: absoluteUrl(project.projectUrl),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}

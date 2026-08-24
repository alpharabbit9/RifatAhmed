/**
 * Phase 9 — `/robots.txt`.
 *
 * Everything public is crawlable; `/admin` is not. That is a tidiness measure
 * rather than a security one — the routes are already gated by middleware and
 * by Supabase RLS, and `robots.txt` is a request, not a lock. Its real job
 * here is keeping the login screen out of search results.
 *
 * The sitemap is advertised absolutely, which is why it goes through
 * `absoluteUrl` (see `lib/site.ts` for how the origin is resolved).
 */

import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}

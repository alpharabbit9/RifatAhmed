/**
 * Everything under `/admin` — the dashboard *and* the login screen — is kept
 * out of search results from here.
 *
 * This is the third of three independent measures, and the only one aimed at
 * crawlers rather than people: middleware redirects anonymous requests
 * (`middleware.ts`), Supabase RLS refuses the data even if a page somehow
 * rendered, and this adds `noindex, nofollow` so the login form never turns up
 * in a search for the owner's name. `robots.txt` asks for the same thing, but
 * a `robots.txt` disallow only stops crawling — a URL discovered elsewhere can
 * still be indexed without it. The meta tag is what actually keeps it out.
 *
 * A layout that renders nothing of its own: the dashboard's chrome lives in
 * `(dashboard)/layout.tsx`, and the login route has none.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

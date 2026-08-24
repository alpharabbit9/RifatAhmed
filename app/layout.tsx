import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { fontDisplay, fontSans, fontEditorial } from "@/lib/fonts";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { MotionProvider } from "@/components/motion/motion-provider";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";

/**
 * Site-wide metadata (PLAN.md phase 9).
 *
 * `metadataBase` is the piece that makes everything below work: without it,
 * the relative URLs used here and in the page-level metadata (`/projects`,
 * the generated `opengraph-image` routes) are emitted as-is, and a crawler
 * reading `og:image` as a relative path simply drops it.
 *
 * `title.template` means every page sets only its own name — `title:
 * "Achievements"` renders as "Achievements | Rifat Ahmed". Pages that need the
 * full string verbatim (the case studies, whose titles are already long) set
 * `title.absolute` instead.
 *
 * There is deliberately no `openGraph.images` here. The file conventions
 * (`app/opengraph-image.tsx` and its per-route siblings) provide them, and
 * they inherit down the tree — declaring images in both places is how you end
 * up with two `og:image` tags and a coin flip over which one unfurls.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  keywords: [
    "Rifat Ahmed",
    "full stack developer",
    "AI agent builder",
    "Next.js developer",
    "React developer",
    "portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

/**
 * The site is dark-only by design (Design_System.md §1), so it says so twice:
 * `colorScheme` makes the browser paint form controls, scrollbars and the
 * overscroll area dark instead of flashing white, and `themeColor` matches the
 * page background so mobile browser chrome blends into it.
 *
 * `maximumScale` is left alone on purpose — pinch-zoom is an accessibility
 * requirement, and locking it is the single most common a11y regression in a
 * "polished" viewport tag.
 */
export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontEditorial.variable}`}
    >
      <body>
        <SmoothScroll />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

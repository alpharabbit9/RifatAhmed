import localFont from "next/font/local";
import { Inter, Cormorant_Garamond } from "next/font/google";

/**
 * Font configuration via `next/font` (self-hosted, zero layout shift).
 *
 * Display  → Brunson, self-hosted from /public/fonts. One @font-face, two
 *   formats (woff2 primary, ttf fallback) — the browser picks woff2.
 * Body/UI  → Inter.
 * Editorial accent (optional, short quotes/captions only) → Cormorant Garamond.
 *
 * Apply all three variables on <html> in the root layout:
 *
 *   import { fontDisplay, fontSans, fontEditorial } from "@/lib/fonts";
 *
 *   <html
 *     lang="en"
 *     className={`${fontDisplay.variable} ${fontSans.variable} ${fontEditorial.variable}`}
 *   >
 *     <body>{children}</body>
 *   </html>
 */
export const fontDisplay = localFont({
  src: [
    {
      path: "../public/fonts/Brunson.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Brunson.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const fontEditorial = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

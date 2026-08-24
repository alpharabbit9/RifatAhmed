/**
 * The navbar mark, from the CMS.
 *
 * `NotchNavbar` already accepts a `logo` node and falls back to
 * `/images/logo.png` when none is passed, so wiring the uploaded logo in is
 * one prop on `app/page.tsx` — no edit to the shared navbar component, which
 * another phase owns.
 */

import Image from "next/image";
import Link from "next/link";
import { isVectorImage } from "@/features/hero/constants";
import { getLogoUrl } from "@/features/hero/data";

export async function SiteLogo() {
  const logoUrl = await getLogoUrl();

  return (
    <Link
      // Absolute, not `#home`: the navbar renders on `/projects` too, where a
      // bare fragment would go nowhere. On the home page `SmoothScroll` still
      // treats it as a same-page anchor and scrolls.
      href="/#home"
      aria-label="Home"
      className="group relative flex items-center justify-center"
    >
      <Image
        src={logoUrl}
        alt="Rifat Ahmed"
        width={38}
        height={38}
        priority
        unoptimized={isVectorImage(logoUrl)}
        className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
      />
    </Link>
  );
}

"use client";

/**
 * Framer Motion's global reduced-motion switch, mounted once from the root
 * layout (PLAN.md phase 9).
 *
 * `reducedMotion="user"` makes every `motion` component on the site honour the
 * OS setting without each one asking: transform and layout animations are
 * dropped, opacity is kept, so a reveal still *arrives* — it just stops
 * travelling. That is what the accessibility guidance actually asks for
 * (vestibular triggers are movement, not change), and it is why this is a
 * global config rather than a `useReducedMotion()` call added to another
 * twenty components.
 *
 * Components that already branch on `useReducedMotion()` keep working exactly
 * as they did: this narrows what Framer animates, it does not fight anything
 * a component chose to do itself.
 *
 * A provider around `children` costs nothing on the server: children arrive as
 * an already-rendered prop, so wrapping them here does not pull the page into
 * the client bundle.
 *
 * The other three motion engines are switched off elsewhere — see the note in
 * `styles/globals.css` for the full map.
 */

import { MotionConfig } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

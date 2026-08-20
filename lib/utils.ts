import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, resolving Tailwind conflicts sensibly.
 * Requires: `npm i clsx tailwind-merge` (already present in shadcn projects).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

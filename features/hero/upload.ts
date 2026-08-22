/**
 * Browser-side image upload for the admin hero form.
 *
 * Same reasoning as `features/career/upload.ts`: the file goes straight from
 * the admin's browser to Supabase Storage rather than through a Server Action,
 * because Next.js caps Server Action bodies at 1 MB by default and the
 * portrait alone is bigger than that. The admin's session cookie authorises
 * the write (the `media: admin write` policy), and only the resulting
 * `{ url, storage_path }` is submitted with the form.
 *
 * Uploads are keyed `hero/<kind>/<timestamp>-<name>`, so replacing an image
 * never overwrites the previous file in place — the old key is deleted by the
 * server action once the new row has been saved.
 */

import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKET,
  type HeroImageKind,
} from "@/features/hero/constants";

export interface UploadedImage {
  url: string;
  storage_path: string;
}

export type ImageUploadResult =
  | { ok: true; image: UploadedImage }
  | { ok: false; error: string };

function sanitiseFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = (dot === -1 ? name : name.slice(0, dot))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const extension = (dot === -1 ? "" : name.slice(dot + 1))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);

  return `${stem || "image"}${extension ? `.${extension}` : ""}`;
}

export async function uploadHeroImage(
  file: File,
  kind: HeroImageKind,
): Promise<ImageUploadResult> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: `${file.name}: use a PNG, JPG, WebP, AVIF or SVG.`,
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `${file.name} is larger than 6 MB.` };
  }

  const supabase = createClient();
  const path = `hero/${kind}/${Date.now()}-${sanitiseFileName(file.name)}`;

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { ok: false, error: `${file.name}: ${error.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return { ok: true, image: { url: publicUrl, storage_path: path } };
}

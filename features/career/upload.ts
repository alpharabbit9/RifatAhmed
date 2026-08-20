/**
 * Browser-side logo upload for the admin career form.
 *
 * Same reasoning as `features/projects/upload.ts`: the file goes straight from
 * the admin's browser to Supabase Storage rather than through a Server Action,
 * because Next.js caps Server Action bodies at 1 MB by default. The admin's
 * session cookie authorises the write (the `media: admin write` policy), and
 * only the resulting `{ url, storage_path }` is submitted with the form.
 *
 * Uploads are keyed `career/<scope-id>/<timestamp>-<name>` so a new entry's
 * logo is already namespaced before its row exists — the form generates the
 * scope id up front and passes it here.
 */

import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_BYTES,
  MEDIA_BUCKET,
} from "@/features/career/constants";

export interface UploadedLogo {
  url: string;
  storage_path: string;
}

export type LogoUploadResult =
  | { ok: true; logo: UploadedLogo }
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

  return `${stem || "logo"}${extension ? `.${extension}` : ""}`;
}

export async function uploadCareerLogo(
  file: File,
  scopeId: string,
): Promise<LogoUploadResult> {
  if (!(ACCEPTED_LOGO_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: `${file.name}: use a PNG, JPG, WebP, AVIF or SVG.` };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: `${file.name} is larger than 2 MB.` };
  }

  const supabase = createClient();
  const path = `career/${scopeId}/${Date.now()}-${sanitiseFileName(file.name)}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
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

  return { ok: true, logo: { url: publicUrl, storage_path: path } };
}

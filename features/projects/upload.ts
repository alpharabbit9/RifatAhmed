/**
 * Browser-side image upload for the admin project form.
 *
 * Files go straight from the admin's browser to Supabase Storage rather than
 * through a Server Action: Next.js caps Server Action bodies at 1 MB by
 * default and a screenshot is routinely several times that. The admin's
 * session cookie authorises the write (the `media: admin write` policy in
 * migration 0004), and only the resulting `{ url, storage_path }` is sent to
 * the server when the project is saved.
 *
 * Uploads are keyed `projects/<project-id>/<timestamp>-<name>`, so a new
 * project's files are already namespaced before its row exists — the form
 * generates the id up front and passes it here.
 */

import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKET,
} from "@/features/projects/constants";

export interface UploadedImage {
  url: string;
  storage_path: string;
  /** Original filename — shown under the thumbnail in the picker. */
  name: string;
}

export type UploadResult =
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

export async function uploadProjectImage(
  file: File,
  projectId: string,
): Promise<UploadResult> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: `${file.name}: use a PNG, JPG, WebP or AVIF.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `${file.name} is larger than 8 MB.` };
  }

  const supabase = createClient();
  const path = `projects/${projectId}/${Date.now()}-${sanitiseFileName(file.name)}`;

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

  return {
    ok: true,
    image: { url: publicUrl, storage_path: path, name: file.name },
  };
}

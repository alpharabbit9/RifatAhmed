"use client";

/**
 * Phase 1 — Hero admin screen.
 *
 * `profile` is a singleton, so unlike the list-shaped screens (Projects,
 * Career, Services) this is one form with one save: four panels submitting
 * together, which is also what keeps a half-saved hero impossible.
 *
 * Images upload straight to Supabase Storage from here (see
 * `features/hero/upload.ts`); the form only submits the resulting URL and
 * storage key, because Next.js caps Server Action bodies at 1 MB and the
 * portrait is bigger than that on its own.
 *
 * Chrome (Panel, Field, the input/button class strings) is imported from the
 * Projects admin's `ui.tsx` rather than copied again, so every CMS screen
 * stays visually identical.
 */

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ImageIcon, ImageUp, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ErrorBanner,
  Field,
  ghostButtonClass,
  hintClass,
  iconButtonClass,
  inputClass,
  labelClass,
  Panel,
  primaryButtonClass,
  textareaClass,
} from "../projects/ui";
import type { HeroProfile } from "@/features/hero/data";
import {
  ACCEPTED_IMAGE_TYPES,
  isVectorImage,
  MAX_NAME_LINES,
  MAX_QUOTE_WORDS,
  MAX_ROLE_LABELS,
  type HeroImageKind,
} from "@/features/hero/constants";
import { uploadHeroImage } from "@/features/hero/upload";
import { updateProfile } from "@/features/hero/actions";

type ImageValue = { url: string; storage_path: string | null };

/**
 * `data.ts` resolves an unset image to the file that ships with the repo, so
 * a `/images/…` path here means "nothing uploaded yet" — the picker shows its
 * empty state and the form submits a blank, which stores null.
 */
function toImageValue(url: string, storagePath: string | null): ImageValue | null {
  return url.startsWith("/") ? null : { url, storage_path: storagePath };
}

/* -------------------------------------------------------------------------- */
/* Image picker                                                               */
/* -------------------------------------------------------------------------- */

function ImagePicker({
  kind,
  label,
  hint,
  fallbackSrc,
  value,
  onChange,
  onError,
}: {
  kind: HeroImageKind;
  label: string;
  hint: string;
  /** Previewed (dimmed) while nothing has been uploaded. */
  fallbackSrc: string;
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  onError: (error: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    onError(null);
    setUploading(true);
    const result = await uploadHeroImage(file, kind);
    setUploading(false);

    // Let the same file be re-picked after a failure.
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      onError(result.error);
      return;
    }

    onChange({
      url: result.image.url,
      storage_path: result.image.storage_path,
    });
  }

  const src = value?.url ?? fallbackSrc;

  return (
    <div className="flex flex-col gap-3">
      <span className={labelClass}>{label}</span>

      <div className="flex flex-wrap items-center gap-4">
        <span
          className={cn(
            "relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-border bg-background",
            !value && "opacity-55",
          )}
        >
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              sizes="80px"
              unoptimized={isVectorImage(src)}
              className="object-contain"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-foreground-subtle" strokeWidth={1.5} />
          )}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <label
            className={cn(
              ghostButtonClass,
              "cursor-pointer",
              uploading && "pointer-events-none opacity-50",
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageUp className="h-3.5 w-3.5" />
            )}
            {value ? "Replace" : "Upload"}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
          </label>

          {value && (
            <button
              type="button"
              onClick={() => {
                onError(null);
                onChange(null);
              }}
              className={cn(
                iconButtonClass,
                "hover:border-primary/50 hover:text-primary",
              )}
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className={hintClass}>{hint}</p>

      {/* What the form actually submits — the file itself went straight to
          storage from the browser. */}
      <input type="hidden" name={`${kind}_url`} value={value?.url ?? ""} />
      <input
        type="hidden"
        name={`${kind}_storage_path`}
        value={value?.storage_path ?? ""}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function HeroEditor({
  profile,
  resumeUrl,
}: {
  profile: HeroProfile;
  /** Uploaded on the Footer screen; the hero only labels the link. */
  resumeUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [portrait, setPortrait] = React.useState<ImageValue | null>(() =>
    toImageValue(profile.portrait_image_url, profile.portrait_storage_path),
  );
  const [artwork, setArtwork] = React.useState<ImageValue | null>(() =>
    toImageValue(profile.artwork_image_url, profile.artwork_storage_path),
  );
  const [logo, setLogo] = React.useState<ImageValue | null>(() =>
    toImageValue(profile.logo_url, profile.logo_storage_path),
  );

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Hero</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-subtle">
        The first screen of the site — the name, the introduction, the three
        routes out of it, and the portrait composition behind them. The social
        icons and the CV file itself are managed on the{" "}
        <span className="text-foreground-muted">Footer</span> screen, so the
        hero and the footer can never disagree.
      </p>

      <form
        action={(formData) => {
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const result = await updateProfile(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setSaved(true);
            router.refresh();
          });
        }}
        className="mt-6 flex flex-col gap-6"
      >
        <Panel
          title="Name & introduction"
          description="Everything in the left-hand column, top to bottom."
        >
          <div className="flex flex-col gap-5">
            <Field
              label="Name"
              htmlFor="hero-name"
              hint={`One display line per line, up to ${MAX_NAME_LINES}. The first renders in cream, the rest in burgundy — both extruded. Brunson has no lowercase glyphs, so it always reads as caps.`}
            >
              <textarea
                id="hero-name"
                name="name"
                rows={2}
                required
                defaultValue={profile.name}
                className={textareaClass}
              />
            </Field>

            <Field
              label="Role labels"
              htmlFor="hero-role-labels"
              hint={`The small label above the name, one per line (max ${MAX_ROLE_LABELS}). A single line sits still; several cycle through the slot.`}
            >
              <textarea
                id="hero-role-labels"
                name="role_labels"
                rows={2}
                defaultValue={profile.role_labels.join("\n")}
                className={textareaClass}
              />
            </Field>

            <Field
              label="Tagline"
              htmlFor="hero-tagline"
              hint="The large statement under the name. Leave blank to hide it."
            >
              <textarea
                id="hero-tagline"
                name="tagline"
                rows={2}
                defaultValue={profile.tagline}
                className={textareaClass}
              />
            </Field>

            <Field
              label="Introduction"
              htmlFor="hero-bio"
              hint="The short paragraph beside the burgundy rule. Leave blank to hide it."
            >
              <textarea
                id="hero-bio"
                name="bio"
                rows={3}
                defaultValue={profile.bio}
                className={textareaClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Calls to action"
          description="One button and two text links: the work, the conversation, the CV."
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Button label"
                htmlFor="hero-cta-label"
                hint="Leave blank to hide the button entirely."
              >
                <input
                  id="hero-cta-label"
                  name="cta_label"
                  defaultValue={profile.cta_label}
                  placeholder="View My Work"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Button link"
                htmlFor="hero-cta-href"
                hint="An anchor on this page (#projects) or a full URL."
              >
                <input
                  id="hero-cta-href"
                  name="cta_href"
                  defaultValue={profile.cta_href}
                  placeholder="#projects"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Contact link label"
                htmlFor="hero-contact-label"
                hint="Leave blank to hide it."
              >
                <input
                  id="hero-contact-label"
                  name="contact_cta_label"
                  defaultValue={profile.contact_cta_label}
                  placeholder="Let's Talk"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Contact link destination"
                htmlFor="hero-contact-href"
                hint="An anchor on this page (#contact) or a full URL."
              >
                <input
                  id="hero-contact-href"
                  name="contact_cta_href"
                  defaultValue={profile.contact_cta_href}
                  placeholder="#contact"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="CV link label"
              htmlFor="hero-resume-label"
              hint={
                resumeUrl
                  ? "Points at the CV uploaded on the Footer screen. Leave blank to hide the link."
                  : "No CV has been uploaded yet — upload one on the Footer screen and this link appears by itself."
              }
            >
              <input
                id="hero-resume-label"
                name="resume_cta_label"
                defaultValue={profile.resume_cta_label}
                placeholder="Download CV"
                className={cn(inputClass, "sm:max-w-[280px]")}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Editorial column"
          description="The rolling quote and the social cluster on the right-hand side (desktop only)."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Rolling words"
              htmlFor="hero-quote-words"
              hint={`One per line, up to ${MAX_QUOTE_WORDS}; they cycle through a single slot and the last one is highlighted. Leave blank to hide the block.`}
            >
              <textarea
                id="hero-quote-words"
                name="quote_words"
                rows={4}
                defaultValue={profile.quote_words.join("\n")}
                className={textareaClass}
              />
            </Field>

            <Field
              label="Social row label"
              htmlFor="hero-connect-label"
              hint="Set in the italic editorial face above the icons. Leave blank to hide the label."
            >
              <input
                id="hero-connect-label"
                name="connect_label"
                defaultValue={profile.connect_label}
                placeholder="Let's Connect"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Images"
          description="PNG, JPG, WebP, AVIF or SVG, up to 6 MB each. Removing one restores the file that ships with the site."
        >
          <div className="grid gap-7 lg:grid-cols-3">
            <ImagePicker
              kind="portrait"
              label="Portrait"
              hint="A square cut-out on a transparent background — the radial mask fades its edges into the black."
              fallbackSrc={profile.portrait_image_url}
              value={portrait}
              onChange={setPortrait}
              onError={setError}
            />

            <ImagePicker
              kind="artwork"
              label="Brush artwork"
              hint="The stroke behind the portrait. Needs true alpha, or it shows as a rectangle."
              fallbackSrc={profile.artwork_image_url}
              value={artwork}
              onChange={setArtwork}
              onError={setError}
            />

            <ImagePicker
              kind="logo"
              label="Navbar logo"
              hint="The mark in the centre of the notch bar. Rendered at 36×36."
              fallbackSrc={profile.logo_url}
              value={logo}
              onChange={setLogo}
              onError={setError}
            />
          </div>
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className={primaryButtonClass}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save hero
          </button>

          <AnimatePresence>
            {saved && !isPending && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-foreground-subtle"
              >
                Saved.
              </motion.span>
            )}
          </AnimatePresence>

          <ErrorBanner error={error} />
        </div>
      </form>
    </div>
  );
}

"use client";

/**
 * Contact details admin screen.
 *
 * These four strings live on the `profile` singleton, so — like the Hero
 * screen — this is one form with one save rather than a list.
 *
 * Chrome (Panel, Field, the input/button class strings) is imported from the
 * Projects admin's `ui.tsx` rather than copied again, so every CMS screen
 * stays visually identical.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ErrorBanner,
  Field,
  inputClass,
  Panel,
  primaryButtonClass,
} from "../projects/ui";
import type { ContactDetails } from "@/features/contact/constants";
import { updateContactDetails } from "@/features/contact/actions";

export function ContactEditor({ contact }: { contact: ContactDetails }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <div>
      <p className="label-overline">Site</p>
      <h1 className="mt-2 font-display text-3xl text-foreground">Contact</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-subtle">
        How people reach you. These are printed in the &ldquo;Let&apos;s Work
        Together&rdquo; section and in the footer on every page, so changing the
        email here changes it everywhere. Messages sent through the form are
        read on the <span className="text-foreground-muted">Messages</span>{" "}
        screen.
      </p>

      <form
        action={(formData) => {
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const result = await updateContactDetails(formData);
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
          title="Direct lines"
          description="Listed beside the contact form. Leave the phone or the address blank to hide that row."
        >
          <div className="flex flex-col gap-5">
            <Field
              label="Email address"
              htmlFor="contact-email"
              hint="Required — the contact section, the form's fallback line and the footer all link to it."
            >
              <input
                id="contact-email"
                name="contact_email"
                type="email"
                required
                defaultValue={contact.email}
                placeholder="you@example.com"
                className={cn(inputClass, "sm:max-w-[420px]")}
              />
            </Field>

            <Field
              label="Phone number"
              htmlFor="contact-phone"
              hint="Optional. Written exactly as you type it and dialled as a tel: link — spaces and dashes are stripped automatically."
            >
              <input
                id="contact-phone"
                name="contact_phone"
                type="tel"
                defaultValue={contact.phone}
                placeholder="+880 1XXX-XXXXXX"
                className={cn(inputClass, "sm:max-w-[420px]")}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="contact-location"
              hint="Shown under “Based in”. A city and country reads better here than a street address."
            >
              <input
                id="contact-location"
                name="contact_location"
                defaultValue={contact.location}
                placeholder="Dhaka, Bangladesh — working worldwide"
                className={inputClass}
              />
            </Field>
          </div>
        </Panel>

        <Panel
          title="Availability"
          description="The small pill under the direct lines, with the pulsing burgundy dot."
        >
          <Field
            label="Availability label"
            htmlFor="contact-availability"
            hint="Leave blank to hide the pill — worth doing when you are not taking work."
          >
            <input
              id="contact-availability"
              name="availability_label"
              defaultValue={contact.availability_label}
              placeholder="Available for freelance & full-time"
              className={inputClass}
            />
          </Field>
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
            Save contact details
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

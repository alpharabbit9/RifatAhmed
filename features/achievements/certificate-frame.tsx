/**
 * Phase 7 — the framed certificate itself.
 *
 * One component serves both the wall and the full-size viewer, because a
 * certificate that changed its construction between the two would stop reading
 * as the same physical object. Everything that varies is size, and size is
 * handled by the container query in `achievements-wall.css` rather than by a
 * second set of styles here.
 *
 * The stack, outside in:
 *
 *   frame    dark wood moulding, bevelled by its shadow stack
 *    mat     cream board, bronze lip where it meets the wood
 *     window the opening — √2 landscape, the ratio a certificate is printed on
 *      scan  the uploaded image, `object-contain` so nothing is ever cropped
 *      glass one raking reflection over the top
 *
 * When no scan has been uploaded the window holds a *typeset* certificate
 * instead of a grey placeholder box: issuer, title, holder and date, set on
 * cream. That is what lets the wall look finished on the day the section ships
 * with nothing but rows in a table — and it is why every seeded certificate in
 * migration 0011 deliberately has a null image.
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_ASPECT,
  certificateAlt,
  formatIssued,
} from "@/features/achievements/constants";
import type { Achievement } from "@/features/achievements/data";

export interface CertificateFrameProps {
  achievement: Achievement;
  /** Whose certificate this is — used for alt text and the plate's "awarded to". */
  holder: string;
  /** `sizes` for the scan. The wall and the viewer request very different widths. */
  sizes: string;
  /** Above-the-fold certificates skip lazy loading. */
  priority?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* The typeset plate — shown when there is no scan                            */
/* -------------------------------------------------------------------------- */

function TypesetPlate({
  achievement,
  holder,
}: {
  achievement: Achievement;
  holder: string;
}) {
  const issued = formatIssued(achievement.issued_on);

  return (
    <div
      className="achv-plate absolute inset-0 flex flex-col justify-between"
      style={{ padding: "6.5cqw" }}
    >
      <div className="flex items-start justify-between gap-[4cqw]">
        <div>
          {achievement.issuer && (
            <p
              className="font-sans font-semibold uppercase"
              style={{
                fontSize: "2.5cqw",
                letterSpacing: "0.18em",
                color: "#5b0f18",
              }}
            >
              {achievement.issuer}
            </p>
          )}
          <p
            className="font-sans uppercase"
            style={{
              marginTop: "1.6cqw",
              fontSize: "2.1cqw",
              letterSpacing: "0.22em",
              color: "rgba(36,27,27,0.55)",
            }}
          >
            Certificate of Completion
          </p>
        </div>

        {/* The wax seal. Its ring is drawn by the shadow in the stylesheet. */}
        <span
          aria-hidden
          className="achv-seal shrink-0 rounded-full"
          style={{ width: "8.5cqw", height: "8.5cqw" }}
        />
      </div>

      <div>
        <h4
          className="font-display uppercase"
          style={{
            fontSize: "6.6cqw",
            lineHeight: 1.02,
            letterSpacing: "0.008em",
            color: "#1a1414",
          }}
        >
          {achievement.title}
        </h4>

        <div className="achv-plate-rule" style={{ marginTop: "3.2cqw" }} />

        <p
          className="font-sans"
          style={{
            marginTop: "2.6cqw",
            fontSize: "2.4cqw",
            letterSpacing: "0.06em",
            color: "rgba(36,27,27,0.62)",
          }}
        >
          Awarded to {holder}
        </p>
      </div>

      <div className="flex items-end justify-between gap-[4cqw]">
        <p
          className="font-sans"
          style={{ fontSize: "2.2cqw", color: "rgba(36,27,27,0.5)" }}
        >
          {issued || " "}
        </p>

        {achievement.category && (
          <p
            className="font-sans font-semibold uppercase"
            style={{
              fontSize: "2cqw",
              letterSpacing: "0.2em",
              color: "rgba(91,15,24,0.7)",
            }}
          >
            {achievement.category}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The frame                                                                  */
/* -------------------------------------------------------------------------- */

export function CertificateFrame({
  achievement,
  holder,
  sizes,
  priority = false,
  className,
}: CertificateFrameProps) {
  return (
    <div className={cn("achv-frame", className)}>
      <div className="achv-mat">
        <div
          className="achv-window"
          style={{ aspectRatio: `${CERTIFICATE_ASPECT} / 1` }}
        >
          {achievement.image_url ? (
            <Image
              src={achievement.image_url}
              alt={certificateAlt(achievement, holder)}
              fill
              sizes={sizes}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              // Never cropped: a certificate that loses its border stops
              // looking like a document. Odd ratios letterbox onto the mat.
              className="achv-scan object-contain"
            />
          ) : (
            <TypesetPlate achievement={achievement} holder={holder} />
          )}

          <span
            aria-hidden
            className="achv-glass pointer-events-none absolute inset-0"
          />
        </div>
      </div>
    </div>
  );
}

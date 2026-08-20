"use client";

/**
 * DepthText — extruded 3D display type (React Bits, JS + CSS variant),
 * ported to TypeScript for this codebase.
 *
 * Renders `layers` stacked copies of the word, each pushed further back on
 * the Z axis and tinted from `faceColor` toward `depthColor`, then a crisp
 * front face on top. The whole stack tilts toward the pointer (damped by
 * `smoothing`) and falls back to a slow orbit when the pointer is idle or
 * unavailable, so it still reads as 3D on touch devices.
 *
 * The word inherits its font family from the parent — set `font-display` on
 * the heading that wraps it. Honours `prefers-reduced-motion` by freezing at
 * the base rotation.
 */

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import "./depth-text.css";

/** Hard ceiling on stacked copies — each layer is a real DOM node. */
const MAX_LAYERS = 64;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Tint for one extrusion layer.
 *
 * The upstream component eases the mix *quadratically* and starts at 72% face
 * colour, which puts the layers just behind a cream face at ~70% cream — on a
 * near-black background the extrusion then reads brighter than the face it is
 * supposed to sit behind. The exponent here is below 1 instead, so the tint
 * drops away immediately behind the face and the stack reads as one shadowed
 * slab rather than a glowing block. `faceMix` caps how much face colour ever
 * bleeds in.
 */
const getLayerColor = (
  faceColor: string,
  depthColor: string,
  index: number,
  total: number,
  faceMix: number,
) => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = Math.pow(progress, 0.6);
  const mix = Math.round((1 - eased) * Math.max(faceMix - 2, 0) + 2);
  return `color-mix(in srgb, ${faceColor} ${mix}%, ${depthColor})`;
};

const getTransform = (rotateX: number, rotateY: number) =>
  `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;

export interface DepthTextProps {
  /** The word or short phrase rendered as extruded type. */
  text?: string;
  /** Number of stacked copies forming the extrusion. Clamped to 2–64. */
  layers?: number;
  /** Spacing in px between each layer of the extrusion. */
  depth?: number;
  /** Colour of the crisp front face. */
  faceColor?: string;
  /** Tint used for the back of the extrusion and its shadow. */
  depthColor?: string;
  /**
   * Ceiling on how much `faceColor` bleeds into the layer nearest the face,
   * as a percentage. Low values keep the extrusion dark and let the face
   * stay the brightest thing in the stack.
   */
  faceMix?: number;
  /** Opacity of the coloured drop shadow behind the face, 0–1. */
  shadowStrength?: number;
  /** Maximum pointer-driven rotation, in degrees. */
  tilt?: number;
  /** Enables smoothed pointer parallax on fine-pointer devices. */
  pointerTracking?: boolean;
  /** Damping used to ease rotation toward the pointer target. */
  smoothing?: number;
  /** Perspective distance in px for the 3D stack. */
  perspective?: number;
  /** Adds a subtle orbit when pointer tracking is unavailable or idle. */
  autoOrbit?: boolean;
  /** Speed of the fallback orbit, in cycles per second. */
  orbitSpeed?: number;
  /** CSS `font-size` for the display word. */
  fontSize?: string;
  /** CSS `font-weight` for every layer. */
  fontWeight?: number | string;
  /** CSS `line-height` for the stack. */
  lineHeight?: number | string;
  /** CSS `letter-spacing` for the stack. */
  letterSpacing?: string;
  /** Adds a soft coloured drop shadow to the front face. */
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function DepthText({
  text = "Elevate",
  layers = 34,
  depth = 2.4,
  faceColor = "#f8f1e7",
  depthColor = "#5b0f18",
  faceMix = 26,
  shadowStrength = 0.22,
  tilt = 7.5,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  fontSize = "clamp(3rem, 12vw, 7rem)",
  fontWeight = 900,
  lineHeight = 0.86,
  letterSpacing = "-0.01em",
  shadow = true,
  className = "",
  style = {},
}: DepthTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000);
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2);
  const safeFaceMix = clamp(Number(faceMix) || 0, 0, 100);
  const safeShadowStrength = clamp(Number(shadowStrength) || 0, 0, 1);

  const baseRotation = useMemo(
    () => ({ x: -safeTilt * 0.32, y: safeTilt * 0.42 }),
    [safeTilt],
  );

  const depthLayers = useMemo(
    () =>
      Array.from({ length: safeLayers }, (_, layerIndex) => {
        // Painted back-to-front so the nearest slab lands closest to the face.
        const index = safeLayers - layerIndex;
        return {
          index,
          color: getLayerColor(
            faceColor,
            depthColor,
            index,
            safeLayers,
            safeFaceMix,
          ),
          transform: `translateZ(${-index * safeDepth}px)`,
        };
      }),
    [safeLayers, safeDepth, faceColor, depthColor, safeFaceMix],
  );

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion;

    if (reducedMotion) {
      stage.style.transform = getTransform(baseRotation.x, baseRotation.y);
      return;
    }

    let frameId = 0;
    let activePointer = false;
    let startTime = performance.now();
    let pausedAt = 0;
    const current = { ...baseRotation };
    const target = { ...baseRotation };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      activePointer = true;
      const x = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8),
        -1,
        1,
      );
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8),
        -1,
        1,
      );

      target.x = baseRotation.x - y * safeTilt;
      target.y = baseRotation.y + x * safeTilt;
    };

    const handlePointerLeave = () => {
      activePointer = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
    };

    if (canTrackPointer) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("blur", handlePointerLeave);
    }

    const tick = (now: number) => {
      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const elapsed = (now - startTime) / 1000;
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        // A pointer-capable device only idles briefly, so its orbit stays
        // small; touch devices get the fuller sweep as their only motion cue.
        const fallbackAmount = canTrackPointer ? 0.18 : 0.55;
        target.x = baseRotation.x + Math.sin(orbit) * safeTilt * fallbackAmount;
        target.y =
          baseRotation.y + Math.cos(orbit * 0.85) * safeTilt * fallbackAmount;
      }

      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      stage.style.transform = getTransform(current.x, current.y);
      frameId = requestAnimationFrame(tick);
    };

    stage.style.transform = getTransform(current.x, current.y);

    /**
     * Only animate while the stack is actually on screen.
     *
     * The hero renders its mobile and desktop trees at the same time and
     * hides one with `lg:hidden` / `hidden lg:grid`, so without this the
     * `display: none` copy would drive a 60fps loop forever. It also parks
     * the loop once the hero scrolls out of view.
     */
    const start = () => {
      if (frameId) return;
      // Rewind the orbit clock past the pause so the phase picks up where it
      // left off rather than snapping.
      if (pausedAt) startTime += performance.now() - pausedAt;
      pausedAt = 0;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
      pausedAt = performance.now();
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "120px" },
    );
    observer.observe(root);

    return () => {
      if (canTrackPointer) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("blur", handlePointerLeave);
      }
      observer.disconnect();
      stop();
    };
  }, [
    autoOrbit,
    baseRotation,
    pointerTracking,
    safeOrbitSpeed,
    safeSmoothing,
    safeTilt,
  ]);

  const rootStyle = {
    ...style,
    "--depth-text-perspective": `${safePerspective}px`,
    "--depth-text-font-size": fontSize,
    "--depth-text-font-weight": fontWeight,
    "--depth-text-line-height": lineHeight,
    "--depth-text-letter-spacing": letterSpacing,
    "--depth-text-face-color": faceColor,
    "--depth-text-shadow": shadow
      ? `0 18px 30px color-mix(in srgb, ${depthColor} ${Math.round(
          safeShadowStrength * 100,
        )}%, transparent), 0 4px 8px rgba(0, 0, 0, 0.3)`
      : "none",
  } as CSSProperties;

  return (
    <span
      ref={rootRef}
      className={`depth-text ${className}`.trim()}
      style={rootStyle}
    >
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map((layer) => (
          <span
            aria-hidden="true"
            className="depth-text__layer"
            key={layer.index}
            style={{ color: layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
}

export default DepthText;

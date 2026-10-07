import * as THREE from "three";

// Green -> amber -> red. Display colors only, NOT clinical thresholds.
const LOW = new THREE.Color("#2fbf86");
const MID = new THREE.Color("#f5b83d");
const HIGH = new THREE.Color("#ef4452");

/**
 * Map a probability (0..1) to a color by blending through two segments:
 *   0.0 -> 0.5 : LOW  -> MID
 *   0.5 -> 1.0 : MID  -> HIGH
 * Pass `out` to reuse a Color and avoid allocating one every call.
 */
export function riskColor(p: number, out = new THREE.Color()): THREE.Color {
  const t = Math.min(1, Math.max(0, p));
  return t < 0.5
    ? out.copy(LOW).lerp(MID, t / 0.5)
    : out.copy(MID).lerp(HIGH, (t - 0.5) / 0.5);
}

/** Same color as a CSS hex string (#rrggbb) for ordinary HTML elements. */
export const riskColorHex = (p: number) => `#${riskColor(p).getHexString()}`;

/** Human-readable band used in the UI. */
export function riskLevel(p: number): "Low" | "Moderate" | "High" {
  return p < 0.35 ? "Low" : p < 0.65 ? "Moderate" : "High";
}

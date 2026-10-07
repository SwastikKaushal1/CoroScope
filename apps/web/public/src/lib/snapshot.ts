/**
 * Tiny bridge between the 3D scene and the report page.
 * Scene.tsx registers a function that renders the current view to an image;
 * the results page calls captureHeart() right before navigating to /report.
 */
type CaptureFn = () => string | null;
let capture: CaptureFn | null = null;

export function registerCapture(fn: CaptureFn) {
  capture = fn;
  return () => {
    if (capture === fn) capture = null; // only unregister if nobody replaced us
  };
}

/** JPEG data URL of the current 3D view, or null if no scene is mounted. */
export const captureHeart = (): string | null => capture?.() ?? null;

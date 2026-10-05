/**
 * SINGLE SOURCE OF TRUTH for the vessels.
 * The 3D scene, the store and the dashboard all read this list, so adding a
 * vessel here adds it everywhere (curve, label, slider, detail card).
 */
export type ArteryId = "LAD" | "LCX" | "RCA";

export interface ArteryDef {
  id: ArteryId;
  label: string;
  supplies: string;
  /**
   * Rough path of the vessel in the heart's local space.
   * Space: heart ~1 wide (x), ~2 tall (y), ~1.3 deep (z), centred on 0,0,0, front = +z.
   * Viewer's left = patient's right. Every sampled point is later snapped onto the
   * mesh surface by raycasting (see Heart.tsx), so small errors are fine.
   * Tip: set DEBUG_PICK = true in Heart.tsx, click the heart, and paste the
   * logged coordinates here to refine a path.
   */
  waypoints: [number, number, number][];
  /** Where along the vessel (0 = start, 1 = end) the floating label is anchored. */
  labelAt: number;
}

export const ARTERIES: ArteryDef[] = [
  {
    id: "LAD",
    label: "Left anterior descending",
    supplies: "Front of the heart",
    waypoints: [
      [0.05, 0.15, 0.6],
      [0.1, -0.1, 0.6],
      [0.15, -0.4, 0.5],
      [0.2, -0.7, 0.35],
      [0.22, -0.9, 0.2],
    ],
    labelAt: 0.55,
  },
  {
    id: "LCX",
    label: "Left circumflex",
    supplies: "Side and back of the heart",
    waypoints: [
      [0.15, 0.3, 0.45],
      [0.35, 0.2, 0.4],
      [0.45, 0.0, 0.2],
      [0.45, -0.1, -0.1],
    ],
    labelAt: 0.6,
  },
  {
    id: "RCA",
    label: "Right coronary artery",
    supplies: "Right side and bottom of the heart",
    waypoints: [
      [-0.2, 0.3, 0.5],
      [-0.35, 0.1, 0.45],
      [-0.4, -0.2, 0.35],
      [-0.35, -0.5, 0.3],
    ],
    labelAt: 0.5,
  },
];

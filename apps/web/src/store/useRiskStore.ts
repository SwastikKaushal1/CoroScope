import { create } from "zustand";
import type { ArteryId } from "@/config/arteries";

export type Probabilities = Record<ArteryId, number>;

/**
 * Global UI state shared by the 3D scene and the dashboard (Zustand).
 *
 *  - probabilities : predicted stenosis probability per vessel (0..1)
 *  - selected      : vessel the user clicked (3D or panel), or null
 *  - hovered       : vessel under the pointer (3D or panel), or null
 *
 * Components subscribe with selectors, e.g. `useRiskStore(s => s.selected)`,
 * so each one re-renders ONLY when the slice it reads changes. This matters
 * for 3D: moving a slider must not re-render the whole canvas tree.
 */
interface RiskState {
  probabilities: Probabilities;
  selected: ArteryId | null;
  hovered: ArteryId | null;
  setProbability: (id: ArteryId, value: number) => void;
  setAll: (p: Probabilities) => void;
  select: (id: ArteryId | null) => void;
  hover: (id: ArteryId | null) => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  probabilities: { LAD: 0.5, LCX: 0.5, RCA: 0.5 },
  selected: null,
  hovered: null,
  setProbability: (id, value) =>
    set((s) => ({ probabilities: { ...s.probabilities, [id]: value } })),
  setAll: (p) => set({ probabilities: p }),
  select: (id) => set({ selected: id }),
  hover: (id) => set({ hovered: id }),
}));

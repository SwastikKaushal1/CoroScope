import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ArteryId } from "@/config/arteries";
import type { Patient, PredictionResponse } from "@/lib/types";

export type Probabilities = Record<ArteryId, number>;

/**
 * Global UI state shared by the 3D scene and the dashboard (Zustand).
 *
 *  - probabilities : stenosis probability per vessel (0..1). The 3D arteries read THIS.
 *  - result        : the full API response (overall CAD + explanations). Saved in
 *                    sessionStorage so a page refresh on /results keeps working.
 *  - selected      : vessel the user clicked (3D or panel). null = "overall CAD".
 *  - hovered       : vessel under the pointer (3D or panel), or null.
 *
 * After the API call, the form does:   setResult(data); router.push("/results");
 */
interface RiskState {
  probabilities: Probabilities;
  result: PredictionResponse | null;
  selected: ArteryId | null;
  hovered: ArteryId | null;
  /** Report header details (typed on /report). */
  patient: Patient;
  /** JPEG data URL of the 3D heart, captured when the user clicks "Export report". */
  snapshot: string | null;
  setPatient: (p: Partial<Patient>) => void;
  setSnapshot: (s: string | null) => void;
  setProbability: (id: ArteryId, value: number) => void;
  setAll: (p: Probabilities) => void;
  setResult: (r: PredictionResponse) => void;
  clearResult: () => void;
  select: (id: ArteryId | null) => void;
  hover: (id: ArteryId | null) => void;
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set) => ({
      probabilities: { LAD: 0.5, LCX: 0.5, RCA: 0.5 },
      result: null,
      selected: null,
      hovered: null,
      patient: { name: "", id: "", doctor: "", age: "", sex: "" },
      snapshot: null,
      setPatient: (p) => set((s) => ({ patient: { ...s.patient, ...p } })),
      setSnapshot: (snapshot) => set({ snapshot }),
      setProbability: (id, value) => set((s) => ({ probabilities: { ...s.probabilities, [id]: value } })),
      setAll: (p) => set({ probabilities: p }),
      setResult: (r) =>
        set({
          result: r,
          patient: { name: "", id: "", doctor: "", age: "", sex: "", ...r.patient },
          selected: null,
          hovered: null,
          probabilities: {
            LAD: r.predictions.LAD.probability,
            LCX: r.predictions.LCX.probability,
            RCA: r.predictions.RCA.probability,
          },
        }),
      clearResult: () => set({ result: null, selected: null, hovered: null }),
      select: (id) => set({ selected: id }),
      hover: (id) => set({ hovered: id }),
    }),
    {
      name: "cardiomap-result",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ result: s.result, probabilities: s.probabilities, patient: s.patient, snapshot: s.snapshot }),
    }
  )
);

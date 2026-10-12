import { createContext, useContext } from "react";
import type { Probabilities } from "@/store/useRiskStore";

/**
 * Lets a scene show its own vessel probabilities (e.g. the landing-page demo) instead of
 * the stored prediction. null = read from the store.
 */
export const ProbabilityOverride = createContext<Probabilities | null>(null);
export const useProbabilityOverride = () => useContext(ProbabilityOverride);

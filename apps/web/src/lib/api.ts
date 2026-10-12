import type { MetricsResponse, Payload, PredictionResponse, Presets } from "./types";

/**
 * Same-origin by default: next.config.ts forwards /api/* to FastAPI, so the app works from any
 * device that can open the site (e.g. a phone scanning the share QR). Override only if needed.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const detail = await res.json().then((b) => b.detail).catch(() => "");
    throw new Error(detail ? `${res.status}: ${detail}` : `Server returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const predict = (payload: Payload, signal?: AbortSignal) =>
  request<PredictionResponse>("/predict?top_k=60", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

// Static per training run, so fetch once per page load.
let presets: Promise<Presets> | null = null;
let metrics: Promise<MetricsResponse> | null = null;
export const getPresets = () => (presets ??= request<Presets>("/presets").catch((e) => { presets = null; throw e; }));
export const getMetrics = () => (metrics ??= request<MetricsResponse>("/metrics").catch((e) => { metrics = null; throw e; }));

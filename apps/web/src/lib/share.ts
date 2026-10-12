/**
 * Share links. The answers (model inputs only; never the name) are compressed and put in the
 * URL fragment: /results#s=<data>. Browsers never send the fragment to any server, so nothing is
 * stored or logged; whoever opens the link re-runs the same models on the same answers.
 */
import type { Payload } from "./types";

const VERSION = 1;

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([data as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function encodeShare(inputs: Payload): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ v: VERSION, i: inputs }));
  return toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
}

export async function decodeShare(data: string): Promise<Payload | null> {
  try {
    const json = await pipe(fromBase64Url(data), new DecompressionStream("deflate-raw"));
    const parsed = JSON.parse(new TextDecoder().decode(json));
    return parsed?.v === VERSION && parsed.i && typeof parsed.i === "object" ? (parsed.i as Payload) : null;
  } catch {
    return null;
  }
}

export const SHARE_PREFIX = "#s=";

export async function shareUrl(inputs: Payload) {
  return `${window.location.origin}/results${SHARE_PREFIX}${await encodeShare(inputs)}`;
}

/** localhost links only open on this computer; a phone needs the network address or a live link. */
export const isLocalOnly = () => ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Info, X } from "lucide-react";
import { isLocalOnly, shareUrl } from "@/lib/share";
import type { PredictionResponse } from "@/lib/types";

/** Modal with a QR code + copyable link that opens the same results on another device. */
export default function ShareDialog({ result, onClose }: { result: PredictionResponse; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    let alive = true;
    shareUrl(result.inputs ?? {}).then(async (u) => {
      const img = await QRCode.toDataURL(u, { margin: 1, width: 560, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } });
      if (alive) { setUrl(u); setQr(img); }
    });
    return () => { alive = false; };
  }, [result]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <dialog ref={dialog} onClose={onClose} onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Share with your doctor</h2>
            <p className="mt-1 text-sm text-ink-2">They scan this with their phone camera and see the same 3D heart and results.</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="rounded-lg p-1 text-ink-3 hover:bg-sunken hover:text-ink"><X className="size-5" /></button>
        </div>

        <div className="mx-auto mt-5 grid aspect-square w-64 place-items-center rounded-xl border border-line bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="QR code that opens these results" className="size-full" /> : <span className="text-sm text-ink-3">Making QR code…</span>}
        </div>

        <div className="mt-4 flex gap-2">
          <input readOnly value={url} aria-label="Share link" onFocus={(e) => e.currentTarget.select()}
            className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-xs text-ink-2" />
          <button type="button" onClick={copy} disabled={!url} className="btn btn-primary h-10 px-3 text-sm">
            {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy</>}
          </button>
        </div>

        <p className="mt-4 flex gap-2 text-xs leading-5 text-ink-3">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>The link carries your answers (not your name) inside it. Nothing is saved on a server. Anyone with the link can see the results, so share it only with people you trust.</span>
        </p>
        {isLocalOnly() && (
          <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-xs leading-5 text-warn">
            This link uses <b>localhost</b>, so it only opens on this computer. For a phone, open Coroscope using your
            computer&rsquo;s network address (shown as &ldquo;Network&rdquo; when the web app starts) or the live site, then share again.
          </p>
        )}
      </div>
    </dialog>
  );
}

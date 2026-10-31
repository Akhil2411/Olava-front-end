"use client";

import { useState } from "react";
import { useBrowserValue } from "@/lib/utils/client";

/**
 * Copy link, WhatsApp and the native share sheet (Web Share API, with copy as the fallback).
 * Always shares the STABLE public URL handed in by the server, never a preview or storage URL.
 */
export function ShareButtons({ url, text, whatsAppUrl, tone = "app" }: { url: string; text: string; whatsAppUrl?: string; tone?: "app" | "site" }) {
  const [copied, setCopied] = useState(false);
  const canShare = useBrowserValue(() => typeof navigator.share === "function", false);

  const wa = whatsAppUrl ?? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const share = async () => {
    try { await navigator.share({ title: text, text, url }); } catch { /* user cancelled */ }
  };

  const btn = tone === "site"
    ? "inline-flex items-center gap-2 rounded-full border border-[var(--s-accent)] px-4 py-2 text-sm font-semibold text-[var(--s-accent)] hover:bg-[var(--s-accent)] hover:text-[var(--s-bg)]"
    : "inline-flex items-center gap-2 rounded-full border-[1.5px] border-pink-dark px-4 py-2 text-sm font-semibold text-pink-dark hover:bg-tint";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
        <span aria-hidden="true">💬</span> Share on WhatsApp
      </a>
      <button type="button" onClick={copy} className={btn}>
        <span aria-hidden="true">🔗</span> {copied ? "Link copied!" : "Copy link"}
      </button>
      {canShare ? (
        <button type="button" onClick={share} className={btn}><span aria-hidden="true">↗</span> Share…</button>
      ) : null}
      <span role="status" className="sr-only">{copied ? "Link copied to clipboard" : ""}</span>
    </div>
  );
}

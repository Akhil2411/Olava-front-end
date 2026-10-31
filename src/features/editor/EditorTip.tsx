"use client";

import { useState, useSyncExternalStore } from "react";

const KEY = "olava.editorTip.dismissed";
const noSubscribe = () => () => {};
const wasDismissed = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

const TIPS = [
  { icon: "✎", title: "Tap to edit", text: "Tap any text or photo in the preview to change it." },
  { icon: "☰", title: "Sections", text: "Show, hide, reorder or add sections." },
  { icon: "🎨", title: "Template", text: "Switch design or colours. Nothing is lost." },
  { icon: "👁", title: "Preview", text: "See it as guests will on a phone, tablet or computer." },
];

/**
 * "How editing works" above the editor until dismissed (remembered in this browser only; if storage is
 * unavailable it simply shows again next time). Afterwards a one-line reminder stays.
 */
export function EditorTip() {
  const remembered = useSyncExternalStore(noSubscribe, wasDismissed, () => true);
  const [closed, setClosed] = useState(false);
  if (remembered || closed) {
    return <p className="text-sm text-mute">Tap any text or photo in the preview to edit it. Changes save to your private draft; guests see them after you publish.</p>;
  }
  const dismiss = () => {
    setClosed(true);
    try { localStorage.setItem(KEY, "1"); } catch { /* private mode: fine */ }
  };
  return (
    <section aria-labelledby="editor-tip-title" className="rounded-[22px] border border-pink/40 bg-blush p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="editor-tip-title" className="font-sans text-base font-semibold">This is where you edit your website</h2>
        <button type="button" onClick={dismiss} className="shrink-0 rounded-full border border-pink/40 bg-white px-4 py-1.5 text-sm font-semibold text-pink-dark hover:bg-tint">Got it</button>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {TIPS.map((t) => (
          <li key={t.title} className="flex items-start gap-2.5 rounded-2xl bg-white p-2.5 sm:gap-3 sm:p-3">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-tint text-sm sm:size-9 sm:text-base">{t.icon}</span>
            <span className="min-w-0 text-xs sm:text-sm">
              <span className="block font-semibold text-ink">{t.title}</span>
              <span className="block text-mute">{t.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-mute">Changes save to your private draft; guests see them after you publish.</p>
    </section>
  );
}

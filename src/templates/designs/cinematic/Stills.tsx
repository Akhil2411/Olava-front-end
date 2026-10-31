"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Still { src?: string; alt: string; art?: string }

/**
 * The "Stills" gallery: a staggered parallax collage (the layout repeats every seven photos) and the supplied
 * design's full-screen viewer (arrows, swipe, Escape; focus returns to the photo that opened it).
 */
export function Stills({ stills, interactive }: { stills: Still[]; interactive: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const x0 = useRef<number | null>(null);
  const n = stills.length;
  const show = useCallback((i: number) => setOpen(((i % n) + n) % n), [n]);
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);

  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const html = document.documentElement, previous = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(open - 1);
      if (e.key === "ArrowRight") show(open + 1);
    };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); html.style.overflow = previous; };
  }, [open, close, show]);

  const media = (s: Still) => (
    <div data-still="" className={s.src ? "has-photo" : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {s.src ? <img src={s.src} alt={s.alt} loading="lazy" /> : <span className="still-art" dangerouslySetInnerHTML={{ __html: s.art ?? "" }} />}
    </div>
  );
  const speeds = [0.06, -0.1, 0.14, -0.06, 0.1, -0.12, 0.08];
  const current = open === null ? null : stills[open];
  const pad = (k: number) => String(k).padStart(2, "0");

  return (
    <>
      <div className="stills-grid">
        {stills.map((s, i) => (
          <figure key={i} className={`g${(i % 7) + 1}`} data-speed={speeds[i % 7]}>
            <button type="button" className="still-btn" disabled={!interactive}
              aria-label={interactive ? `Open photo ${i + 1} of ${n}${s.alt ? `: ${s.alt}` : ""}` : s.alt || `Photo ${i + 1}`}
              onClick={(e) => { opener.current = e.currentTarget; show(i); }}>
              {media(s)}
            </button>
          </figure>
        ))}
      </div>
      {current ? (
        <div className="viewer on" role="dialog" aria-modal="true" aria-label="Photo viewer"
          onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("viewer-stage")) close(); }}
          onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { const s = x0.current; x0.current = null; if (s === null) return; const dx = e.changedTouches[0].clientX - s; if (Math.abs(dx) > 50) show(open! + (dx < 0 ? 1 : -1)); }}>
          <div className="viewer-stage">{media(current)}</div>
          {current.alt && current.src ? <p className="viewer-cap">{current.alt}</p> : null}
          <p className="viewer-count" aria-live="polite">{pad(open! + 1)} / {pad(n)}</p>
          {n > 1 ? <button type="button" className="viewer-btn prev" aria-label="Previous photo" onClick={() => show(open! - 1)}>←</button> : null}
          {n > 1 ? <button type="button" className="viewer-btn next" aria-label="Next photo" onClick={() => show(open! + 1)}>→</button> : null}
          <button ref={closeBtn} type="button" className="viewer-close" onClick={close}>Close</button>
        </div>
      ) : null}
    </>
  );
}

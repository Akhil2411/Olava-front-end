"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Tile { src?: string; alt: string; art?: string }

/**
 * Photo collage (the first seven photos in the design's mosaic; fewer photos use an even grid) with a
 * full-screen viewer: arrows, swipe, Escape, and focus returns to the photo that opened it.
 */
export function Collage({ tiles, interactive }: { tiles: Tile[]; interactive: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const startX = useRef<number | null>(null);
  const n = tiles.length;
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

  const shown = tiles.slice(0, 7);
  const media = (t: Tile) => t.src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={t.src} alt={t.alt} loading="lazy" />
    : <span className="tile-art" dangerouslySetInnerHTML={{ __html: t.art ?? "" }} />;
  const current = open === null ? null : tiles[open];

  return (
    <>
      <div className={`collage reveal${shown.length < 7 ? " collage-even" : ""}`}>
        {shown.map((t, i) => (
          <button key={i} type="button" className={`tile t${i + 1}`} disabled={!interactive}
            aria-label={`Open photo ${i + 1} of ${n}${t.alt ? `: ${t.alt}` : ""}`}
            onClick={(e) => { opener.current = e.currentTarget; show(i); }}>
            {media(t)}
          </button>
        ))}
      </div>
      {n > 7 && interactive ? (
        <button type="button" className="btn btn-line btn-sm collage-more" onClick={(e) => { opener.current = e.currentTarget; show(7); }}>
          See all {n} photos
        </button>
      ) : null}
      {current ? (
        <div className="lightbox open" role="dialog" aria-modal="true" aria-label="Photo viewer"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          onPointerDown={(e) => { startX.current = e.clientX; }}
          onPointerUp={(e) => { const s = startX.current; startX.current = null; if (s !== null && Math.abs(e.clientX - s) > 50) show(open! + (e.clientX < s ? 1 : -1)); }}>
          <button ref={closeBtn} type="button" className="lb-close" aria-label="Close" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          {n > 1 ? <button type="button" className="lb-nav lb-prev" aria-label="Previous photo" onClick={() => show(open! - 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button> : null}
          <figure className="lb-figure">{media(current)}</figure>
          {n > 1 ? <button type="button" className="lb-nav lb-next" aria-label="Next photo" onClick={() => show(open! + 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button> : null}
          {current.alt && current.src ? <p className="lb-cap">{current.alt}</p> : null}
          <p className="lb-count" aria-live="polite">{open! + 1} / {n}</p>
        </div>
      ) : null}
    </>
  );
}

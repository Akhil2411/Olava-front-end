"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Tile { src?: string; alt: string; art?: string }
/** film: a horizontal filmstrip with arrows (Black Tie) · masonry: columns of tall and wide photos (Riviera) · grid */
export type PhotoLayout = "film" | "masonry" | "grid";

/**
 * The Classic designs' gallery, with a full-screen viewer (arrows, swipe, Escape; focus returns to the photo
 * that opened it). Placeholder artwork (no photos yet) can't be opened.
 */
export function Photos({ tiles, layout, interactive }: { tiles: Tile[]; layout: PhotoLayout; interactive: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const track = useRef<HTMLDivElement>(null);
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

  const media = (t: Tile) => t.src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={t.src} alt={t.alt} loading="lazy" />
    : <span className="cl-art" dangerouslySetInnerHTML={{ __html: t.art ?? "" }} />;
  const scroll = (dir: number) => {
    const t = track.current;
    const first = t?.querySelector("button");
    if (t && first) t.scrollBy({ left: dir * (first.getBoundingClientRect().width + 14), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const current = open === null ? null : tiles[open];

  return (
    <>
      <div className={`cl-photos cl-${layout} reveal`} data-count={n}>
        <div className="cl-photos-track" ref={track} {...(layout === "film" ? { tabIndex: 0, role: "group", "aria-label": "Photos (scroll sideways)" } : {})}>
          {tiles.map((t, i) => (
            <button key={i} type="button" className={`cl-tile t${(i % 6) + 1}`} disabled={!interactive}
              aria-label={interactive ? `Open photo ${i + 1} of ${n}${t.alt ? `: ${t.alt}` : ""}` : t.alt || `Photo ${i + 1}`}
              onClick={(e) => { opener.current = e.currentTarget; show(i); }}>
              {media(t)}
            </button>
          ))}
        </div>
      </div>
      {layout === "film" && n > 2 ? (
        <div className="cl-film-ctrl">
          <button type="button" aria-label="Scroll gallery left" onClick={() => scroll(-1)}><span aria-hidden="true">‹</span></button>
          <button type="button" aria-label="Scroll gallery right" onClick={() => scroll(1)}><span aria-hidden="true">›</span></button>
        </div>
      ) : null}
      {current ? (
        <div className="cl-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          onPointerDown={(e) => { startX.current = e.clientX; }}
          onPointerUp={(e) => { const s = startX.current; startX.current = null; if (s !== null && Math.abs(e.clientX - s) > 50) show(open! + (e.clientX < s ? 1 : -1)); }}>
          <button ref={closeBtn} type="button" className="cl-lb-close" aria-label="Close" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          {n > 1 ? <button type="button" className="cl-lb-nav cl-lb-prev" aria-label="Previous photo" onClick={() => show(open! - 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button> : null}
          <figure className="cl-lb-figure">{media(current)}{current.alt ? <figcaption>{current.alt}</figcaption> : null}</figure>
          {n > 1 ? <button type="button" className="cl-lb-nav cl-lb-next" aria-label="Next photo" onClick={() => show(open! + 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button> : null}
          <p className="cl-lb-count" aria-live="polite">{open! + 1} / {n}</p>
        </div>
      ) : null}
    </>
  );
}

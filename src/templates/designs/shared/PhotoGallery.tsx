"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GalleryLayout } from "./layouts";

/** A gallery photo: `alt` is the couple's caption (also the description read out by screen readers). */
export interface GalleryTile { src?: string; alt: string; art?: string }

const arrow = (d: "prev" | "next") => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>;

/**
 * Full-screen photo viewer shared by every gallery: the photo with its caption, arrows, swipe, arrow keys and
 * Escape; focus goes back to whatever opened it. Rendered at the end of <body>.
 */
export function PhotoViewer({ tiles, index, onIndex, onClose }: { tiles: GalleryTile[]; index: number | null; onIndex: (i: number) => void; onClose: () => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const x0 = useRef<number | null>(null);
  const n = tiles.length;
  const show = useCallback((i: number) => onIndex(((i % n) + n) % n), [n, onIndex]);
  useEffect(() => {
    if (index === null) return;
    closeBtn.current?.focus();
    const html = document.documentElement, previous = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); html.style.overflow = previous; };
  }, [index, onClose, show]);
  if (index === null || !tiles[index]) return null;
  const t = tiles[index];
  return createPortal(
    <div className="olv-pv olv-pv-root" role="dialog" aria-modal="true" aria-label="Photo viewer"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onPointerDown={(e) => { x0.current = e.clientX; }}
      onPointerUp={(e) => { const s = x0.current; x0.current = null; if (s !== null && Math.abs(e.clientX - s) > 50) show(index + (e.clientX < s ? 1 : -1)); }}>
      <button ref={closeBtn} type="button" className="olv-pv olv-pv-close" aria-label="Close" onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <figure className="olv-pv olv-pv-figure" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {t.src ? <img src={t.src} alt={t.alt} /> : <span className="olv-pv olv-pv-art" dangerouslySetInnerHTML={{ __html: t.art ?? "" }} />}
        {t.alt ? <figcaption className="olv-pv olv-pv-cap">{t.alt}</figcaption> : null}
      </figure>
      {n > 1 ? (
        <>
          <button type="button" className="olv-pv olv-pv-nav olv-pv-prev" aria-label="Previous photo" onClick={() => show(index - 1)}>{arrow("prev")}</button>
          <button type="button" className="olv-pv olv-pv-nav olv-pv-next" aria-label="Next photo" onClick={() => show(index + 1)}>{arrow("next")}</button>
          <p className="olv-pv olv-pv-count" aria-live="polite">{index + 1} / {n}</p>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

/** Remembers what opened the viewer, so focus can return there. */
export function useViewer() {
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const openAt = useCallback((i: number, from: HTMLElement | null) => { opener.current = from; setOpen(i); }, []);
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  return { open, setOpen, openAt, close };
}

function Media({ t, eager }: { t: GalleryTile; eager?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return t.src ? <img src={t.src} alt={t.alt} loading={eager ? "eager" : "lazy"} /> : <span className="olv-g olv-g-art" dangerouslySetInnerHTML={{ __html: t.art ?? "" }} />;
}

/**
 * The shared gallery layouts (grid, masonry, carousel, filmstrip) that every design can show, each opening
 * the photo viewer. Placeholder artwork (no photos yet) and the editor (`interactive` false) don't open it.
 */
export function PhotoGallery({ tiles, layout, interactive, autoplay = false, className = "" }: {
  tiles: GalleryTile[]; layout: GalleryLayout; interactive: boolean; autoplay?: boolean; className?: string;
}) {
  const v = useViewer();
  const n = tiles.length;
  const tile = (t: GalleryTile, i: number, extra: ReactNode = null) => (
    <button type="button" className="olv-g olv-g-tile" disabled={!interactive}
      aria-label={interactive ? `Open photo ${i + 1} of ${n}${t.alt ? `: ${t.alt}` : ""}` : t.alt || `Photo ${i + 1}`}
      onClick={(e) => v.openAt(i, e.currentTarget)}>
      <Media t={t} eager={i === 0} />{extra}
    </button>
  );
  return (
    <div className={`olv-g olv-g-root ${className}`} data-layout={layout}>
      {layout === "photo-carousel" ? (
        <SlideTrack tiles={tiles} autoplay={autoplay && interactive} render={(t, i) => tile(t, i, t.alt ? <span className="olv-g olv-g-cap">{t.alt}</span> : null)} />
      ) : layout === "photo-filmstrip" ? (
        <StripTrack tiles={tiles} render={tile} />
      ) : (
        <ul className="olv-g olv-g-list" data-count={n}>
          {tiles.map((t, i) => <li key={i} className={`olv-g olv-g-item m${(i % 6) + 1}`}>{tile(t, i)}</li>)}
        </ul>
      )}
      <PhotoViewer tiles={tiles} index={v.open} onIndex={v.setOpen} onClose={v.close} />
    </div>
  );
}

/** One photo at a time: swipe, arrows (always shown), dots; optional gentle autoplay (never with reduced motion). */
function SlideTrack({ tiles, autoplay, render }: { tiles: GalleryTile[]; autoplay: boolean; render: (t: GalleryTile, i: number) => ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const n = tiles.length;
  const go = useCallback((i: number) => {
    const t = track.current;
    if (!t) return;
    const k = ((i % n) + n) % n;
    t.scrollTo({ left: k * t.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [n]);
  const restart = useCallback(() => {
    clearInterval(timer.current);
    if (!autoplay || n < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => { const t = track.current; if (t) go(Math.round(t.scrollLeft / Math.max(1, t.clientWidth)) + 1); }, 4500);
  }, [autoplay, n, go]);
  useEffect(() => {
    restart();
    const t = track.current;
    const onScroll = () => { if (t) setIndex(Math.round(t.scrollLeft / Math.max(1, t.clientWidth))); };
    t?.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearInterval(timer.current); t?.removeEventListener("scroll", onScroll); };
  }, [restart]);
  return (
    <div className="olv-g olv-g-carousel" role="region" aria-roledescription="carousel" aria-label="Photos">
      <div className="olv-g olv-g-track" ref={track} tabIndex={0} onPointerDown={restart}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); } if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); } }}>
        {tiles.map((t, i) => (
          <div key={i} className="olv-g olv-g-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>{render(t, i)}</div>
        ))}
      </div>
      {n > 1 ? (
        <>
          <button type="button" className="olv-g olv-g-nav olv-g-prev" aria-label="Previous photo" onClick={() => { go(index - 1); restart(); }}>{arrow("prev")}</button>
          <button type="button" className="olv-g olv-g-nav olv-g-next" aria-label="Next photo" onClick={() => { go(index + 1); restart(); }}>{arrow("next")}</button>
          <div className="olv-g olv-g-dots">
            {tiles.map((_, i) => (
              <button key={i} type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === index || undefined}
                className={`olv-g olv-g-dot${i === index ? " on" : ""}`} onClick={() => { go(i); restart(); }} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** A row of photos to scroll sideways, with arrow buttons. */
function StripTrack({ tiles, render }: { tiles: GalleryTile[]; render: (t: GalleryTile, i: number) => ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const t = track.current;
    if (t) t.scrollBy({ left: dir * Math.max(200, t.clientWidth * 0.8), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className="olv-g olv-g-strip">
      <div className="olv-g olv-g-strack" ref={track} tabIndex={0} role="group" aria-label="Photos (scroll sideways)">
        {tiles.map((t, i) => <div key={i} className="olv-g olv-g-frame">{render(t, i)}</div>)}
      </div>
      {tiles.length > 1 ? (
        <div className="olv-g olv-g-sctrl">
          <button type="button" className="olv-g olv-g-nav" aria-label="Scroll photos left" onClick={() => scroll(-1)}>{arrow("prev")}</button>
          <button type="button" className="olv-g olv-g-nav" aria-label="Scroll photos right" onClick={() => scroll(1)}>{arrow("next")}</button>
        </div>
      ) : null}
    </div>
  );
}

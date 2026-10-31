"use client";

import { useEffect, useRef, useState } from "react";
import { PhotoViewer, useViewer } from "../shared/PhotoGallery";

export interface Slide { src?: string; alt?: string; art?: string }

/**
 * Swipeable photo carousel with dots and arrows (always shown); advances on its own every few seconds (not with
 * reduced motion). Captions show on the slide; tapping a photo opens the full-screen viewer (`interactive`).
 */
export function Carousel({ slides, autoplay, interactive = false }: { slides: Slide[]; autoplay: boolean; interactive?: boolean }) {
  const viewer = useViewer();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const go = (i: number) => { const t = track.current; if (t) t.scrollTo({ left: i * t.clientWidth, behavior: "smooth" }); };
  const restart = () => {
    clearInterval(timer.current);
    if (!autoplay || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => {
      const t = track.current;
      if (!t) return;
      go((Math.round(t.scrollLeft / t.clientWidth) + 1) % slides.length);
    }, 3800);
  };

  useEffect(() => {
    restart();
    const t = track.current;
    const onScroll = () => { if (t) setIndex(Math.round(t.scrollLeft / Math.max(1, t.clientWidth))); };
    t?.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearInterval(timer.current); t?.removeEventListener("scroll", onScroll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, autoplay]);

  return (
    <div className="carousel" role="region" aria-roledescription="carousel" aria-label="Photos">
      <div className="track" ref={track} onPointerDown={restart} tabIndex={0}>
        {slides.map((s, i) => (
          <div className="slide" key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            {s.src ? (
              <button type="button" className="slide-btn" disabled={!interactive} onClick={(e) => viewer.openAt(i, e.currentTarget)}
                aria-label={interactive ? `Open photo ${i + 1} of ${slides.length}${s.alt ? `: ${s.alt}` : ""}` : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt ?? ""} loading={i === 0 ? "eager" : "lazy"} />
              </button>
            ) : (
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: s.art ?? "" }} />
            )}
            {s.alt ? <span className="slide-cap" aria-hidden="true">{s.alt}</span> : null}
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <>
          <div className="dots">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === index || undefined}
                className={i === index ? "active" : undefined} onClick={() => { go(i); restart(); }} />
            ))}
          </div>
          <button type="button" className="nav-arrow prev" aria-label="Previous photo" onClick={() => { go((index - 1 + slides.length) % slides.length); restart(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="nav-arrow next" aria-label="Next photo" onClick={() => { go((index + 1) % slides.length); restart(); }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      ) : null}
      <PhotoViewer tiles={slides.filter((s) => s.src).length === slides.length ? slides.map((s) => ({ src: s.src, alt: s.alt ?? "" })) : []}
        index={viewer.open} onIndex={viewer.setOpen} onClose={viewer.close} />
    </div>
  );
}

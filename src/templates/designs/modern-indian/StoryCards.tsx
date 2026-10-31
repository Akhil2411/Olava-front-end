"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Story chapters as swipeable cards with a progress bar and previous/next buttons. */
export function StoryCards({ children, count }: { children: ReactNode; count: number }) {
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = track.current, b = bar.current;
    if (!t || !b) return;
    const progress = () => {
      const max = t.scrollWidth - t.clientWidth, visible = t.clientWidth / Math.max(1, t.scrollWidth);
      b.style.width = `${Math.min(100, visible * 100)}%`;
      b.style.transform = `translateX(${max > 0 ? (t.scrollLeft / max) * ((1 - visible) / visible) * 100 : 0}%)`;
    };
    progress();
    t.addEventListener("scroll", progress, { passive: true });
    const ro = new ResizeObserver(progress);
    ro.observe(t);
    return () => { t.removeEventListener("scroll", progress); ro.disconnect(); };
  }, [count]);

  const step = (dir: number) => {
    const t = track.current;
    const card = t?.querySelector<HTMLElement>(".story-card");
    if (t && card) t.scrollBy({ left: dir * (card.getBoundingClientRect().width + 18), behavior: "smooth" });
  };

  return (
    <div className="story-wrap reveal">
      <div className="story-track" ref={track} tabIndex={0} role="group" aria-label="Story chapters">{children}</div>
      {count > 1 ? (
        <div className="story-ctrl">
          <div className="progress" aria-hidden="true"><i ref={bar} /></div>
          <button type="button" className="round-btn" aria-label="Previous chapter" onClick={() => step(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
          <button type="button" className="round-btn" aria-label="Next chapter" onClick={() => step(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
      ) : null}
    </div>
  );
}

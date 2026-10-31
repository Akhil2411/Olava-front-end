"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isShowcase } from "../shared/events";

const DONE = "olava:classic-intro-done";

/**
 * The Classic designs' opening, as in the supplied files: the page starts with "intro" (the hero's pieces
 * hidden), gets "ready" once the fonts are in (the entrance animation runs) and loses "intro" when it ends.
 * With an overlay (Heirloom's crest) the page can't be scrolled until then, and the overlay's
 * [data-cl-skip] button ends it at once. Reduced motion ends it straight away. Not used in the editor.
 */
export function Entrance({ pageId, ms, overlay }: { pageId: string; ms: number; overlay: boolean }) {
  useEffect(() => {
    const page = document.getElementById(pageId);
    if (!page) return;
    // The home page showcase shows the page as it is after the opening.
    const reduce = isShowcase() || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const html = document.documentElement;
    const previous = html.style.overflow;
    if (overlay && !reduce) html.style.overflow = "hidden";
    let ended = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const end = () => {
      if (ended) return;
      ended = true;
      page.classList.add("ready");
      page.classList.remove("intro");
      html.style.overflow = previous;
      window.dispatchEvent(new Event(DONE));
      if (overlay) page.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    };
    const go = () => {
      page.classList.add("ready");
      timers.push(setTimeout(end, reduce ? 0 : ms));
    };
    const skip = page.querySelector<HTMLElement>("[data-cl-skip]");
    skip?.addEventListener("click", end);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() => { if (!ended) timers.push(setTimeout(go, 120)); });
    return () => { timers.forEach(clearTimeout); skip?.removeEventListener("click", end); html.style.overflow = previous; };
  }, [pageId, ms, overlay]);
  return null;
}

/** An opening overlay (Heirloom's crest): fades out with the opening, then leaves the page. */
export function IntroOverlay({ className, children }: { className: string; children: ReactNode }) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const done = () => { t = setTimeout(() => setGone(true), 1100); };
    window.addEventListener(DONE, done);
    return () => { window.removeEventListener(DONE, done); clearTimeout(t); };
  }, []);
  return gone ? null : <div className={className} data-olava-intro="">{children}</div>;
}

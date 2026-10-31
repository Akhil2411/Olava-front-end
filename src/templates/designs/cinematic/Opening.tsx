"use client";

import { useEffect, useRef, useState } from "react";
import { useBrowserValue } from "@/lib/utils/client";
import { announceInviteOpened, rememberIntro, seenIntro } from "../shared/events";
import { Embers } from "./Embers";

/**
 * The opening title card: a diya flickers while the reel "loads" (00 → 100), then "Tap to open" appears. The tap
 * (or Enter / Space) starts the music and the letterbox bars part. Returning guests (same tab) skip it.
 * The page wrapper gets "ready-to-open", then "is-entered", which run the rest of the opening in CSS.
 */
export function Opening({ pageId, storageKey, c1, c2, names, joiner, note }: {
  pageId: string; storageKey: string; c1: string | null; c2: string | null; names: [string, string]; joiner: string; note: string | null;
}) {
  const seen = useBrowserValue(() => seenIntro(storageKey), false);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  const pct = useRef<HTMLSpanElement>(null);
  const tap = useRef<HTMLButtonElement>(null);
  const entered = useRef(false);
  const readyRef = useRef(false);
  const early = useRef(false); // tapped while the reel was still loading: open as soon as it's ready

  useEffect(() => {
    const page = document.getElementById(pageId);
    if (!page) return;
    if (seen) { page.classList.add("ready-to-open", "is-entered"); entered.current = true; return; }
    const html = document.documentElement, previous = html.style.overflow;
    html.style.overflow = "hidden";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const t0 = performance.now(), dur = reduce ? 300 : 2800;
    let raf = 0;
    const count = (now: number) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      if (pct.current) pct.current.textContent = String(Math.round(e * 100)).padStart(2, "0");
      if (p < 1) raf = requestAnimationFrame(count);
      else { page.classList.add("ready-to-open"); readyRef.current = true; setReady(true); if (early.current) tap.current?.click(); else tap.current?.focus({ preventScroll: true }); }
    };
    raf = requestAnimationFrame(count);
    return () => { cancelAnimationFrame(raf); html.style.overflow = previous; };
  }, [pageId, seen]);

  const open = () => {
    if (entered.current) return;
    if (!readyRef.current) { early.current = true; return; }
    entered.current = true;
    announceInviteOpened(); // the tap is the gesture browsers require before music can play
    rememberIntro(storageKey);
    const page = document.getElementById(pageId);
    page?.classList.add("is-entered");
    document.documentElement.style.overflow = "";
    page?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    setTimeout(() => setGone(true), 1400);
  };

  useEffect(() => {
    if (!ready || seen) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !entered.current && document.activeElement !== tap.current) { e.preventDefault(); open(); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  if (seen || gone) return null;
  return (
    <div className="opening" role="dialog" aria-modal="true" aria-label="Open the invitation" data-olava-intro="" onClick={open}>
      <Embers className="embers" count={40} />
      <div className="diya" aria-hidden="true">
        <span className="halo" /><span className="flame" />
        <svg viewBox="0 0 120 50" className="lamp"><path d="M6 14 Q60 58 114 14 Q96 30 60 32 Q24 30 6 14Z" /><path d="M40 30 Q60 46 80 30" className="rim" /></svg>
      </div>
      {c1 ? <p className="credit c1">{c1}</p> : null}
      {c2 ? <p className="credit c2">{c2}</p> : null}
      <p className="credit c3">{names[0]} <i>{joiner}</i> {names[1]}</p>
      <button ref={tap} type="button" className="tap" aria-label="Tap to open the invitation" onClick={(e) => { e.stopPropagation(); open(); }} tabIndex={ready ? 0 : -1}>
        <span className="tap-ring" /><span className="tap-ring r2" />
        <span className="tap-label">Tap to open</span>
      </button>
      {note ? <p className="tap-note">{note}</p> : null}
      <p className="loader-count" aria-hidden="true"><span ref={pct}>00</span></p>
    </div>
  );
}

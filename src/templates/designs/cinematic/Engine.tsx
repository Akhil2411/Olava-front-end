"use client";

import { useEffect } from "react";

/**
 * The Cinematic scroll engine (ported from the supplied design): a smoothed scroll value drives parallax
 * ([data-speed]), the prologue lighting up word by word, the pinned sideways story reel, the end-credits roll and
 * the in-view reveals; each event ("night") tints the whole page in its own colour; and on mouse/trackpad a soft
 * cursor ring follows the pointer. Reduced motion: no smoothing or parallax. Not used in the editor.
 */
export function Engine({ rootId, pageId }: { rootId: string; pageId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    const page = document.getElementById(pageId);
    if (!root || !page) return;
    const RM = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const FINE = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
    const $$ = <T extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<T & Element>(s)] as unknown as T[];
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    let sy = scrollY, vh = innerHeight, lastIdx = -1, raf = 0;
    const onResize = () => { vh = innerHeight; };
    addEventListener("resize", onResize);

    const frame = () => {
      sy = RM ? scrollY : lerp(sy, scrollY, 0.1);
      const lag = scrollY - sy;
      if (!RM) for (const el of $$<HTMLElement>("[data-speed]")) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        const mid = r.top + r.height / 2 - lag;
        el.style.transform = `translate3d(0, ${((mid - vh / 2) * Number(el.dataset.speed)).toFixed(1)}px, 0)`;
      }
      // the prologue lights up word by word (reduced motion: the whole note is lit, see design.css)
      if (!RM) for (const scrub of $$<HTMLElement>(".scrub")) {
        const words = scrub.querySelectorAll<HTMLElement>(".word");
        const pr = scrub.getBoundingClientRect(), p = clamp((vh * 0.85 - pr.top) / (pr.height + vh * 0.3));
        const lit = Math.floor(p * words.length * 1.05);
        words.forEach((w, i) => { w.style.opacity = i < lit ? "1" : ".14"; });
      }
      // the pinned sideways story reel
      for (const story of $$<HTMLElement>(".story.reel")) {
        const track = story.querySelector<HTMLElement>(".story-track");
        if (!track) continue;
        const frames = [...track.querySelectorAll<HTMLElement>(".frame")];
        const sr = story.getBoundingClientRect(), sp = clamp(-sr.top / (sr.height - vh));
        const max = Math.max(0, track.scrollWidth - track.clientWidth);
        track.style.transform = `translate3d(${(-sp * max).toFixed(1)}px,0,0)`;
        const bar = story.querySelector<HTMLElement>(".story-bar i");
        if (bar) bar.style.transform = `scaleX(${sp})`;
        const idx = Math.min(frames.length - 1, Math.round(sp * (frames.length - 1)));
        if (idx !== lastIdx) {
          frames.forEach((f, i) => f.classList.toggle("on", i === idx));
          const no = story.querySelector(".frame-count b");
          if (no) no.textContent = String(idx + 1).padStart(2, "0");
          lastIdx = idx;
        }
      }
      // the end credits roll
      for (const credits of $$<HTMLElement>(".credits")) {
        const roll = credits.querySelector<HTMLElement>(".credits-roll");
        if (!roll) continue;
        const cr = credits.getBoundingClientRect(), cp = clamp(-cr.top / (cr.height - vh));
        roll.style.transform = `translate3d(0, ${(-cp * (roll.offsetHeight + vh * 0.3)).toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // in-view reveals
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.25 });
    const watch = () => $$(".night:not(.in), .reply:not(.in), .place-hero:not(.in), .reveal:not(.in), .cl-in:not(.in)").forEach((el) => io.observe(el));
    watch();

    // each night tints the whole page in its own colour
    const tone = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const n = (e.target as HTMLElement).dataset.tone;
      root.style.setProperty("--bg", n ? `var(--night-${n})` : "var(--bg-0)");
      root.style.setProperty("--glow", n ? `var(--glow-${n})` : "var(--accent)");
    }), { rootMargin: "-48% 0px -48% 0px" });
    $$(".night, .ci-main > section:not(.nights), .nights-head, .credits, .ci-foot").forEach((el) => tone.observe(el));

    // cursor ring (mouse / trackpad only)
    const cleanups: (() => void)[] = [];
    if (FINE && !RM) {
      const cur = page.querySelector<HTMLElement>(".cursor");
      const dot = cur?.querySelector<HTMLElement>(".dot"), ring = cur?.querySelector<HTMLElement>(".ring");
      if (cur && dot && ring) {
        page.classList.add("has-cursor");
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, loop = 0;
        const move = (e: PointerEvent) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; };
        const step = () => { rx = lerp(rx, mx, 0.16); ry = lerp(ry, my, 0.16); ring.style.transform = `translate(${rx}px,${ry}px)`; loop = requestAnimationFrame(step); };
        const over = (e: PointerEvent) => { if ((e.target as Element).closest?.("a, button, summary, [data-cursor]")) cur.classList.add("label"); };
        const out = (e: PointerEvent) => {
          const t = (e.target as Element).closest?.("a, button, summary, [data-cursor]");
          if (t && !t.contains(e.relatedTarget as Node)) cur.classList.remove("label");
        };
        addEventListener("pointermove", move);
        document.addEventListener("pointerover", over);
        document.addEventListener("pointerout", out);
        loop = requestAnimationFrame(step);
        cleanups.push(() => {
          cancelAnimationFrame(loop); removeEventListener("pointermove", move);
          document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out);
          page.classList.remove("has-cursor");
        });
      }
    }
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); io.disconnect(); tone.disconnect(); cleanups.forEach((c) => c()); };
  }, [rootId, pageId]);
  return null;
}

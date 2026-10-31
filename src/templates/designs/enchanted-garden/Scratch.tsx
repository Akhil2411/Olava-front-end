"use client";

import { useEffect, useRef, useState } from "react";
import { rng } from "../shared/svg";
import { HEART } from "./art";

const W = 240, H = 220;

/**
 * Scratch-to-reveal: a glittering heart (theme colours) covers the date; scratching away half of it reveals the
 * date with a burst of confetti. Keyboard and screen-reader users get a "Reveal the date" button.
 */
export function ScratchCover({ sectionId, hint }: { sectionId: string; hint: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const css = getComputedStyle(cv);
    const C = (n: string) => css.getPropertyValue(`--${n}`).trim() || "#999";
    const heart = new Path2D(HEART);
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 1.4;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.scale(dpr, dpr);
    const g = ctx.createRadialGradient(110, 80, 10, 120, 100, 150);
    g.addColorStop(0, C("scr-1")); g.addColorStop(0.35, C("scr-2")); g.addColorStop(1, C("scr-3"));
    ctx.fillStyle = g; ctx.fill(heart);
    const R = rng(3);
    for (let i = 0; i < 1400; i++) {
      const x = R() * W, y = R() * H;
      if (!ctx.isPointInPath(heart, x * dpr, y * dpr)) continue;
      const g1 = R() > 0.5;
      ctx.globalAlpha = g1 ? 0.35 + R() * 0.6 : 0.3 + R() * 0.5;
      ctx.fillStyle = g1 ? C("scr-glitter-1") : C("scr-glitter-2");
      ctx.beginPath(); ctx.arc(x, y, R() * 1.1 + 0.3, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = 1.2; ctx.globalAlpha = 0.5; ctx.strokeStyle = C("scr-3"); ctx.stroke(heart); ctx.globalAlpha = 1;

    const opaque = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) n++; return n; };
    const total = opaque();
    let drawing = false, last = { x: 0, y: 0 }, moves = 0, finished = false;
    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
    const to = (p: { x: number; y: number }) => {
      ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, 7); ctx.fill();
      ctx.globalCompositeOperation = "source-over"; last = p;
      if (++moves % 8 === 0 && opaque() / total < 0.5 && !finished) { finished = true; reveal(); }
    };
    const down = (e: PointerEvent) => { e.preventDefault(); drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); to(pos(e)); };
    const move = (e: PointerEvent) => { if (drawing && !finished) to(pos(e)); };
    const up = () => { drawing = false; };
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    return () => { cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reveal() {
    setDone(true);
    confetti(sectionId);
    if (navigator.vibrate) navigator.vibrate(40);
  }

  return (
    <>
      <canvas ref={canvas} className={`scratch-canvas${done ? " cleared" : ""}`} aria-hidden="true" />
      {done ? null : <button type="button" className="olv-sr" onClick={reveal}>{hint}</button>}
    </>
  );
}

function confetti(sectionId: string) {
  const sec = document.getElementById(sectionId);
  const cv = sec?.querySelector<HTMLCanvasElement>(".confetti");
  const wrap = sec?.querySelector(".scratch-wrap");
  if (!sec || !cv || !wrap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const Wd = sec.clientWidth, Hd = sec.clientHeight;
  cv.width = Wd * dpr; cv.height = Hd * dpr;
  const ctx = cv.getContext("2d")!; ctx.scale(dpr, dpr);
  const colors = getComputedStyle(sec).getPropertyValue("--confetti").split(",").map((x) => x.trim()).filter(Boolean);
  const hr = wrap.getBoundingClientRect(), sr = sec.getBoundingClientRect();
  const ox = hr.left - sr.left + hr.width / 2, oy = hr.top - sr.top + hr.height / 2;
  const parts = Array.from({ length: 160 }, () => {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
    return { x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, s: 1.5 + Math.random() * 3.5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0] ?? "#c9a961", sq: Math.random() > 0.5 };
  });
  const t0 = performance.now();
  const frame = (t: number) => {
    const el = t - t0;
    ctx.clearRect(0, 0, Wd, Hd);
    for (const p of parts) {
      p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.12; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.globalAlpha = Math.max(0, 1 - el / 4200); ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.sq) ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (el < 4300) requestAnimationFrame(frame); else ctx.clearRect(0, 0, Wd, Hd);
  };
  requestAnimationFrame(frame);
}

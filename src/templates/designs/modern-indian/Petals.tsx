"use client";

import { useEffect, useRef } from "react";
import { onInviteOpened } from "../shared/events";

/** A shower of marigold petals when the guest opens the invitation (not with reduced motion). */
export function Petals() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => onInviteOpened(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTimeout(() => burst(ref.current, 70), 2900);
  }), []);
  return <canvas ref={ref} className="petals" aria-hidden="true" />;
}

function burst(cv: HTMLCanvasElement | null, n: number) {
  const ctx = cv?.getContext("2d");
  if (!cv || !ctx) return;
  const d = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  const cols = getComputedStyle(cv).getPropertyValue("--petals").split(",").map((c) => c.trim()).filter(Boolean);
  let parts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 1.2, vy: 1 + Math.random() * 1.6,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, sw: Math.random() * 6, s: 5 + Math.random() * 6,
    c: cols[(Math.random() * cols.length) | 0] ?? "#e8a33d", life: 0,
  }));
  const frame = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.life++; p.vy = Math.min(p.vy + 0.12, 2.4); p.vx *= 0.985; p.sw += 0.05;
      p.x += p.vx + Math.sin(p.sw) * 0.8; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.abs(Math.cos(p.sw)) * 0.6 + 0.4);
      ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    parts = parts.filter((p) => p.y < H + 30 && p.life < 900);
    if (parts.length) requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  };
  requestAnimationFrame(frame);
}

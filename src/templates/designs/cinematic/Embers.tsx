"use client";

import { useEffect, useRef } from "react";

/** Drifting sparks of light on a canvas, in the theme's --spark colour (ported from the supplied design). */
export function Embers({ className, count }: { className: string; count: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const root = canvas.closest(".olv-ci") ?? document.documentElement;
    const rgb = getComputedStyle(root).getPropertyValue("--spark").trim() || "255,214,150";
    let W = 0, H = 0, raf = 0;
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    size();
    addEventListener("resize", size);
    const spawn = (y?: number) => ({ x: Math.random() * W, y: y ?? H + 10, r: 0.6 + Math.random() * 1.8, vy: 0.25 + Math.random() * 0.6, sw: Math.random() * 6, a: 0.3 + Math.random() * 0.6 });
    const parts = Array.from({ length: count }, () => spawn(Math.random() * H));
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.vy; p.sw += 0.012; p.x += Math.sin(p.sw) * 0.35;
        if (p.y < -10) Object.assign(p, spawn());
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(${rgb},${p.a})`); g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 7); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [count]);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

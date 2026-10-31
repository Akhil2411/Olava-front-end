"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { CYCLE } from "./loaderStore";

/**
 * The Olava mark filling up, as an inline SVG so it can take the template's colours.
 * Colour: the nearest `--loader-color` CSS variable (set from the active template); every shade is derived
 * from it with color-mix (dark/light gradient stops, a light tint for the empty outline).
 * Animation (CSS, see globals.css): fills bottom → top, holds, fades out, then repeats; with reduced motion
 * it shows the full mark with a gentle pulse. Ids are unique per instance (useId), so several can coexist.
 */
export function OlavaLoader({ size = 96, phase = 0, className, decorative = true }: {
  size?: number;
  /** Start the animation part-way through (ms), to continue another instance seamlessly. */
  phase?: number;
  className?: string;
  /** True when a surrounding role="status" carries the announcement. */
  decorative?: boolean;
}) {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const id = (name: string) => `olava-${name}-${uid}`;
  const delay = { animationDelay: `-${Math.round(phase % CYCLE)}ms` } satisfies CSSProperties;
  const color = "var(--loader-color, var(--color-pink-dark, #b0507f))";

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width={size} height={size * 1.1}
      className={cn("olava-loader", className)} focusable="false"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Loading" })}>
      <defs>
        <linearGradient id={id("fill")} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: `color-mix(in oklab, ${color} 78%, black)` }} />
          <stop offset="0.5" style={{ stopColor: `color-mix(in oklab, ${color} 62%, white)` }} />
          <stop offset="1" style={{ stopColor: color }} />
        </linearGradient>
        <path id={id("leaf")} d="M0,0 C8,-9 26,-10 38,0 C26,10 8,9 0,0Z" />
        <g id={id("mark")}>
          <path fillRule="evenodd" stroke="none"
            d="M85,45 C125,45 140,90 132,135 C124,180 90,200 62,196 C30,190 22,150 32,110 C42,68 62,45 85,45Z
               M92,52 C118,54 126,92 120,128 C114,166 92,186 70,182 C48,176 44,146 52,112 C60,76 74,52 92,52Z" />
          <path stroke="none" d="M30,175 C22,190 14,196 8,198 C20,200 34,192 44,180Z" />
          <path fill="none" strokeWidth="3" strokeLinecap="round" d="M62,205 C80,150 110,110 150,28" />
          <use href={`#${id("leaf")}`} transform="translate(72,165) rotate(-140)" />
          <use href={`#${id("leaf")}`} transform="translate(78,158) rotate(-20)" />
          <use href={`#${id("leaf")}`} transform="translate(92,130) rotate(-150)" />
          <use href={`#${id("leaf")}`} transform="translate(98,124) rotate(-10)" />
          <use href={`#${id("leaf")}`} transform="translate(114,95) rotate(-155)" />
          <use href={`#${id("leaf")}`} transform="translate(120,88) rotate(-5)" />
          <use href={`#${id("leaf")}`} transform="translate(136,60) rotate(-130)" />
          <use href={`#${id("leaf")}`} transform="translate(148,32) rotate(-80) scale(.9)" />
          <g stroke="none">
            <circle cx="160" cy="30" r="5" /><circle cx="170" cy="46" r="4.5" />
            <circle cx="152" cy="16" r="4" /><circle cx="166" cy="64" r="4.5" />
            <circle cx="178" cy="30" r="3.5" /><circle cx="150" cy="44" r="3.5" />
          </g>
        </g>
        {/* Rising mask: reveals the fill from bottom to top (animated with CSS transform). */}
        <clipPath id={id("rise")}>
          <rect className="olava-loader-rise" x="0" y="0" width="200" height="220" style={delay} />
        </clipPath>
      </defs>
      {/* empty / outline state: a light tint of the same colour */}
      <use href={`#${id("mark")}`} data-part="empty"
        style={{ fill: `color-mix(in oklab, ${color} 18%, white)`, stroke: `color-mix(in oklab, ${color} 18%, white)` }} />
      {/* filling state */}
      <g clipPath={`url(#${id("rise")})`} className="olava-loader-fill" style={delay}>
        <use href={`#${id("mark")}`} data-part="fill" fill={`url(#${id("fill")})`} stroke={`url(#${id("fill")})`} />
      </g>
    </svg>
  );
}

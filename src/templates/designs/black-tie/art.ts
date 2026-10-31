/**
 * Black Tie artwork, generated as SVG strings from the supplied design (template-black-tie/script.js): Art Deco
 * placeholder illustrations in gold on black, the hero's sunburst and the footer fan. Colours are the design's
 * CSS variables, so a future colourway recolours them. Only our own generated markup goes into these strings.
 */
import type { RenderContext } from "../../types";
import type { ArtKind } from "../classic/Classic";
import { rng } from "../shared/svg";

const gold = "var(--champ)", pale = "var(--pale)", onyx = "var(--onyx)", jet = "var(--art-jet)", glow = "var(--art-glow)";
const f = (n: number) => n.toFixed(1);

function draw(type: number, seed: number, id: string, mono: string): string {
  const R = rng(seed * 53 + 11);
  let s = `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs><radialGradient id="${id}" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="${glow}"/><stop offset="1" stop-color="${onyx}"/></radialGradient></defs>
    <rect width="400" height="500" fill="url(#${id})"/>`;
  const ln = (x1: number, y1: number, x2: number, y2: number, w = 1, o = 1) =>
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${gold}" stroke-width="${w}" opacity="${o}"/>`;
  switch (type % 6) {
    case 0: { // deco skyline under a sunburst
      for (let i = 0; i <= 24; i++) { const a = Math.PI + (i * Math.PI) / 24; s += ln(200, 300, 200 + Math.cos(a) * 320, 300 + Math.sin(a) * 320, 0.7, 0.35); }
      s += `<circle cx="200" cy="300" r="70" fill="none" stroke="${gold}" opacity=".6"/>`;
      const b = [[40, 330, 50], [92, 250, 44], [140, 200, 56], [200, 150, 60], [262, 210, 50], [314, 270, 46], [362, 320, 40]];
      for (const [x, top, w] of b) {
        s += `<path d="M${x - w / 2} 500 V${top + 30} L${x - w / 4} ${top + 30} V${top + 10} L${x} ${top} L${x + w / 4} ${top + 10} V${top + 30} L${x + w / 2} ${top + 30} V500Z" fill="${jet}" stroke="${gold}" stroke-width=".9"/>`;
        for (let y = top + 44; y < 490; y += 16) s += `<rect x="${x - w / 2 + 8}" y="${y}" width="${w - 16}" height="2" fill="${gold}" opacity="${(0.15 + R() * 0.35).toFixed(2)}"/>`;
      }
      break;
    }
    case 1: { // champagne coupe tower
      const coupe = (x: number, y: number) => `<path d="M${x - 26} ${y} Q${x} ${y + 26} ${x + 26} ${y} Z" fill="${pale}" opacity=".9"/><path d="M${x} ${y + 13} V${y + 34} M${x - 12} ${y + 36} H${x + 12}" stroke="${gold}" stroke-width="1.4"/>`;
      for (const [x, y] of [[200, 120], [170, 176], [230, 176], [140, 232], [200, 232], [260, 232], [110, 288], [170, 288], [230, 288], [290, 288]]) s += coupe(x, y);
      for (let i = 0; i < 30; i++) s += `<circle cx="${f(100 + R() * 200)}" cy="${f(60 + R() * 220)}" r="${f(0.8 + R() * 1.6)}" fill="${pale}" opacity="${(0.3 + R() * 0.6).toFixed(2)}"/>`;
      s += `<rect x="60" y="340" width="280" height="6" fill="${gold}"/><path d="M60 360 H340" stroke="${gold}" stroke-width=".6"/>`;
      break;
    }
    case 2: { // ring inside a deco diamond
      s += `<path d="M200 70 L330 250 L200 430 L70 250Z" fill="none" stroke="${gold}" stroke-width="1.2"/><path d="M200 96 L310 250 L200 404 L90 250Z" fill="none" stroke="${gold}" stroke-width=".6" opacity=".6"/>`;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += ln(200 + Math.cos(a) * 70, 268 + Math.sin(a) * 70, 200 + Math.cos(a) * 92, 268 + Math.sin(a) * 92, 0.8, 0.6); }
      s += `<circle cx="200" cy="268" r="48" fill="none" stroke="${pale}" stroke-width="5"/><path d="M182 222 L200 196 L218 222 L200 232Z" fill="${pale}"/>`;
      break;
    }
    case 3: { // fan pattern with a monogram plaque
      for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
        const x = c * 90 + (r % 2) * 45 - 10, y = r * 90 + 20;
        for (let k = 0; k < 4; k++) s += `<path d="M${x - 40 + k * 10} ${y + 45} A${40 - k * 10} ${40 - k * 10} 0 0 1 ${x + 40 - k * 10} ${y + 45}" fill="none" stroke="${gold}" stroke-width=".8" opacity="${(0.25 + k * 0.15).toFixed(2)}"/>`;
      }
      s += `<rect x="110" y="190" width="180" height="120" fill="${onyx}" stroke="${gold}"/><text x="200" y="262" text-anchor="middle" font-family="Marcellus, serif" font-size="40" letter-spacing="6" fill="${pale}">${mono}</text>`;
      break;
    }
    case 4: { // crescent moon over arches
      s += `<circle cx="270" cy="130" r="48" fill="${pale}"/><circle cx="292" cy="116" r="44" fill="url(#${id})"/>`;
      for (let i = 0; i < 40; i++) s += `<circle cx="${f(R() * 400)}" cy="${f(R() * 260)}" r="${f(0.5 + R())}" fill="${pale}" opacity="${(0.3 + R() * 0.5).toFixed(2)}"/>`;
      for (let i = 0; i < 5; i++) { const x = 20 + i * 76; s += `<path d="M${x} 500 V360 A38 38 0 0 1 ${x + 76} 360 V500" fill="${jet}" stroke="${gold}"/><path d="M${x + 12} 500 V364 A26 26 0 0 1 ${x + 64} 364 V500" fill="none" stroke="${gold}" stroke-width=".5" opacity=".6"/>`; }
      break;
    }
    default: { // horn of light
      for (let i = 0; i < 14; i++) s += `<path d="M200 420 L${60 + i * 21} 80" stroke="${gold}" stroke-width=".7" opacity="${(0.2 + (i % 3) * 0.15).toFixed(2)}"/>`;
      s += `<ellipse cx="200" cy="80" rx="150" ry="22" fill="none" stroke="${pale}"/><circle cx="200" cy="420" r="16" fill="${gold}"/><rect x="120" y="436" width="160" height="30" fill="${jet}" stroke="${gold}"/>`;
    }
  }
  return s + "</svg>";
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const STORY = [0, 1, 2, 4, 5];
const GALLERY = [3, 4, 0, 5, 1, 2, 4, 3];

export function art(kind: ArtKind, i: number, id: string, ctx: RenderContext, text?: string): string {
  const { partnerOneName: a, partnerTwoName: b } = ctx.site.couple;
  const couple = `${a.trim().slice(0, 1)} ◆ ${b.trim().slice(0, 1)}`.toUpperCase();
  if (kind === "person") {
    const ini = (text ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return draw(3, i + 3, id, esc(ini || couple));
  }
  if (kind === "story") return draw(STORY[i % STORY.length], i + 1, id, esc(couple));
  return draw(GALLERY[i % GALLERY.length], i + 4, id, esc(couple));
}

/** The sunburst behind the hero arch (its lines draw in during the opening). */
export function rays(): string {
  let s = "";
  for (let i = 0; i <= 36; i++) {
    const a = Math.PI + (i * Math.PI) / 36, x = 600 + Math.cos(a) * 760, y = 470 + Math.sin(a) * 760;
    s += `<line x1="600" y1="470" x2="${f(x)}" y2="${f(y)}" pathLength="1" style="transition-delay:${(Math.abs(i - 18) * 0.03).toFixed(2)}s"/>`;
  }
  return s + `<circle cx="600" cy="470" r="300"/><circle cx="600" cy="470" r="318"/><circle cx="600" cy="470" r="430"/>`;
}

/** The gold fan emblem above the footer names. */
export function fan(): string {
  let s = "";
  for (let i = 0; i <= 12; i++) { const a = Math.PI + (i * Math.PI) / 12; s += `<line x1="60" y1="60" x2="${f(60 + Math.cos(a) * 56)}" y2="${f(60 + Math.sin(a) * 56)}" stroke="${gold}" stroke-width=".8"/>`; }
  return s + `<path d="M4 60 A56 56 0 0 1 116 60" fill="none" stroke="${gold}"/><path d="M60 50 l6 10 -6 10 -6 -10z" fill="${gold}"/>`;
}

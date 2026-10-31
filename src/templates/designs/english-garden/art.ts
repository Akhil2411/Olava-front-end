/**
 * English Garden artwork, generated as SVG strings from the supplied design (template-english-garden/script.js):
 * the botanical branches that grow into the side panel and soft botanical placeholder illustrations.
 * Colours are the design's CSS variables. Only our own generated markup goes into these strings.
 */
import type { RenderContext } from "../../types";
import type { ArtKind } from "../classic/Classic";
import { rng } from "../shared/svg";

const V = (n: string) => `var(--${n})`;
const G = { sage: V("sage"), sageL: V("sage-l"), olive: V("olive"), blush: V("blush"), blush2: V("blush-2"), rose: V("rose"), linen: V("linen"), mint: V("mint"),
  pale: V("art-pale"), lawn: V("art-lawn"), tree: V("art-tree"), tree2: V("art-tree-2"), sky: V("art-sky"), dusk: V("art-dusk"), lake: V("art-lake"), white: V("art-white") };
const f = (n: number) => n.toFixed(1);
const SVG = (vb: string) => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;

/** A branch with leaves and blossoms (its stem draws in and the leaves pop during the opening). */
export function branch(seed: number): string {
  const R = rng(seed);
  let s = `<path class="stem" pathLength="1" d="M20 280 C80 200 140 140 280 30"/>`;
  for (let i = 1; i < 12; i++) {
    const t = i / 12, x = 20 + 260 * t - 10 * Math.sin(t * 3), y = 280 - 250 * t, side = i % 2 ? 1 : -1, d = (0.5 + t * 1.4).toFixed(2);
    s += `<path class="lf" style="transition-delay:${d}s" d="M${f(x)} ${f(y)} q${14 * side} -10 ${28 * side} -4 q-12 10 ${-28 * side} 4z" fill="${R() > 0.5 ? G.sage : G.sageL}" transform="rotate(${f(R() * 30 - 15)} ${f(x)} ${f(y)})"/>`;
  }
  ([[150, 140, 1.5], [210, 90, 1.9], [95, 205, 1.2]] as const).forEach(([x, y, d], k) => {
    let fl = "";
    for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2, px = x + Math.cos(a) * 9, py = y + Math.sin(a) * 9; fl += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="9" ry="6" transform="rotate(${(a * 57).toFixed(0)} ${f(px)} ${f(py)})" fill="${k % 2 ? G.blush : G.blush2}"/>`; }
    s += `<g class="fl" style="transition-delay:${d}s">${fl}<circle cx="${x}" cy="${y}" r="4" fill="${G.rose}"/></g>`;
  });
  return s;
}

function flowers(R: () => number, n: number, y0: number, y1: number, w = 800) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = y0 + R() * (y1 - y0), r = 5 + R() * 9;
    s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${f(r)}" fill="${R() > 0.4 ? G.blush : G.pale}"/><circle cx="${(x + r * 0.7).toFixed(0)}" cy="${(y - r * 0.4).toFixed(0)}" r="${f(r * 0.55)}" fill="${G.sage}" opacity=".75"/>`;
  }
  return s;
}
const tree = (x: number, y: number, h: number, c = G.tree) =>
  `<path d="M${x} ${y} C${f(x - h * 0.16)} ${f(y - h * 0.4)} ${f(x - h * 0.08)} ${f(y - h * 0.9)} ${x} ${y - h} C${f(x + h * 0.08)} ${f(y - h * 0.9)} ${f(x + h * 0.16)} ${f(y - h * 0.4)} ${x} ${y}Z" fill="${c}"/>`;

function pavilion(seed: number, id: string) {
  const R = rng(seed * 41 + 3);
  let s = SVG("0 0 800 500") + `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G.sky}"/><stop offset="1" stop-color="${G.mint}"/></linearGradient></defs>
    <rect width="800" height="500" fill="url(#${id})"/><path d="M0 370 Q400 330 800 370 V500 H0Z" fill="${G.lawn}"/>`;
  s += tree(90, 380, 180) + tree(160, 380, 120, G.tree2) + tree(700, 380, 200) + tree(630, 380, 130, G.tree2);
  s += `<g fill="none" stroke="${G.olive}" stroke-width="2.2"><path d="M330 375 V245 M470 375 V245 M310 245 H490 M300 245 Q400 140 500 245"/><path d="M400 158 V140"/></g><circle cx="400" cy="136" r="6" fill="${G.olive}"/>
    <path d="M330 245 q35 20 70 0 q35 20 70 0" fill="none" stroke="${G.rose}" stroke-width="1.5"/>`;
  return s + flowers(R, 70, 370, 490) + "</svg>";
}

function person(i: number, ini: string) {
  let s = SVG("0 0 300 300") + `<rect width="300" height="300" fill="${G.linen}"/>`;
  for (let k = 0; k < 22; k++) { const a = (k / 22) * Math.PI * 2, x = 150 + Math.cos(a) * 92, y = 150 + Math.sin(a) * 92; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="13" ry="5" fill="${k % 3 ? G.sage : G.sageL}" transform="rotate(${(a * 57 + 60).toFixed(0)} ${f(x)} ${f(y)})"/>`; }
  for (const [x, y] of [[150, 58], [70, 190], [230, 190]]) {
    for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; s += `<circle cx="${f(x + Math.cos(a) * 8)}" cy="${f(y + Math.sin(a) * 8)}" r="7" fill="${i % 2 ? G.blush2 : G.blush}"/>`; }
    s += `<circle cx="${x}" cy="${y}" r="4" fill="${G.rose}"/>`;
  }
  return s + `<text x="150" y="176" text-anchor="middle" font-family="Libre Caslon Display, Georgia, serif" font-size="78" fill="${G.olive}">${ini}</text></svg>`;
}

function vignette(t: number, seed: number) {
  const R = rng(seed * 41 + 3);
  let s = SVG("0 0 200 200") + `<rect width="200" height="200" fill="${G.mint}"/>`;
  switch (t % 4) {
    case 0: // rain and an umbrella
      s += `<path d="M0 150 Q100 135 200 150 V200 H0Z" fill="${G.lawn}"/><path d="M50 108 Q100 46 150 108 Q137 100 125 108 Q112 100 100 108 Q88 100 75 108 Q62 100 50 108Z" fill="${G.rose}"/><path d="M100 108 V160 q0 9 -8 9 q-7 0 -7 -7" fill="none" stroke="${G.olive}" stroke-width="2.5"/>`;
      for (let i = 0; i < 26; i++) s += `<path d="M${(R() * 200).toFixed(0)} ${(R() * 140).toFixed(0)} l-3 9" stroke="${G.sage}" stroke-width="1.4"/>`;
      break;
    case 1: // a letter and a pressed flower
      s += `<g transform="rotate(-8 100 110)"><rect x="40" y="70" width="120" height="80" fill="${G.white}" stroke="${G.sage}"/><path d="M40 70 L100 115 L160 70" fill="none" stroke="${G.sage}"/></g><circle cx="100" cy="112" r="10" fill="${G.rose}"/>`;
      s += `<g transform="translate(140 40) rotate(30)"><ellipse rx="6" ry="13" fill="${G.blush}"/><path d="M0 12 V40" stroke="${G.sage}" stroke-width="1.5"/></g>`;
      break;
    case 2: // the lake at sunset
      s = SVG("0 0 200 200") + `<rect width="200" height="200" fill="${G.dusk}"/><circle cx="130" cy="80" r="24" fill="${G.blush}"/><rect y="110" width="200" height="90" fill="${G.lake}"/>
        <path d="M0 110 h30 v-18 a10 10 0 0 1 20 0 v18 h40 v-30 c0 -14 12 -22 24 -26 c12 4 24 12 24 26 v30 h62" fill="${G.sage}"/><path d="M80 150 h50 l-8 9 h-34z" fill="${G.olive}"/><path d="M40 135 h40 M120 172 h50" stroke="${G.white}" opacity=".6"/>`;
      break;
    default: // a ring among the flowers
      s += flowers(R, 16, 120, 200, 200);
      s += `<circle cx="100" cy="92" r="32" fill="none" stroke="${G.olive}" stroke-width="5"/><path d="M88 58 L100 44 L112 58 L100 64Z" fill="${G.white}" stroke="${G.olive}" stroke-width="1.5"/>`;
  }
  return s + "</svg>";
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function art(kind: ArtKind, i: number, id: string, _ctx: RenderContext, text?: string): string {
  if (kind === "plate" || kind === "tile") return pavilion(i + 1, id);
  if (kind === "person") return person(i, esc((text ?? "").trim().slice(0, 1).toUpperCase() || "♥"));
  if (kind === "story") return vignette(i, i + 1);
  return i % 3 === 0 ? pavilion(i + 2, id) : vignette(i, i + 5);
}

export const sprig = `<path d="M10 30 C40 10 80 10 110 30"/><ellipse cx="34" cy="17" rx="8" ry="3.5" transform="rotate(-30 34 17)"/><ellipse cx="60" cy="13" rx="8" ry="3.5"/><ellipse cx="86" cy="17" rx="8" ry="3.5" transform="rotate(30 86 17)"/>`;

/**
 * Enchanted Garden artwork, generated as SVG markup from the design's theme variables (ported from the supplied
 * design's script). Contains no customer content, so it is safe to inject as markup. Ids are prefixed "eg-".
 */
import { f2, pointsAlong, rng, scallopPath, type Segment } from "../shared/svg";

const C = (name: string) => `var(--${name})`;

function beads(segments: Segment[], gap: number, r: number) {
  return pointsAlong(segments, gap)
    .map(([x, y]) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="url(#eg-pearl)" stroke="${C("pearl-3")}" stroke-width=".5"/>`)
    .join("");
}

export const badgeOuter = scallopPath(100, 90, 86, 76, 18, 0.07);
export const badgeInner = scallopPath(100, 90, 74, 64, 18, 0.06);

/** Shared defs: leaf sprigs, door pattern, drape shape (with pearl beads), pearl gradient. */
export function defs(): string {
  const drapeBeads = beads([[[112, 0], [104, 90], [80, 170], [48, 228]], [[48, 228], [70, 300], [92, 380], [104, 470]]], 9, 3.2);
  return `<defs>
  <radialGradient id="eg-pearl" cx=".35" cy=".35" r=".7">
    <stop offset="0" stop-color="${C("pearl-1")}"/><stop offset=".6" stop-color="${C("pearl-2")}"/><stop offset="1" stop-color="${C("pearl-3")}"/>
  </radialGradient>
  <g id="eg-sprig">
    <path d="M0 0 C 6 -18, 4 -36, 0 -54" fill="none" stroke-width="1.4"/>
    <path d="M1 -8 C 10 -10, 16 -16, 18 -24 C 10 -22, 4 -16, 1 -8Z"/><path d="M0 -14 C -9 -16, -15 -22, -17 -30 C -9 -28, -3 -22, 0 -14Z"/>
    <path d="M3 -24 C 11 -27, 16 -34, 17 -42 C 9 -39, 4 -33, 3 -24Z"/><path d="M2 -30 C -6 -33, -11 -40, -12 -48 C -5 -45, 0 -39, 2 -30Z"/>
    <path d="M1 -42 C 6 -46, 8 -52, 7 -58 C 2 -55, 0 -49, 1 -42Z"/><path d="M0 -50 C -4 -54, -5 -60, -3 -65 C 1 -61, 2 -56, 0 -50Z"/>
  </g>
  <g id="eg-sprig-small">
    <path d="M0 8 V-10" stroke-width="1" fill="none"/><path d="M0 -10 C 3 -14, 3 -18, 0 -21 C -3 -18, -3 -14, 0 -10Z"/>
    <path d="M0 -2 C 5 -3, 9 -6, 10 -10 C 5 -9, 2 -6, 0 -2Z"/><path d="M0 -2 C -5 -3, -9 -6, -10 -10 C -5 -9, -2 -6, 0 -2Z"/>
    <path d="M0 5 C 5 4, 8 1, 9 -3 C 5 -2, 2 1, 0 5Z"/><path d="M0 5 C -5 4, -8 1, -9 -3 C -5 -2, -2 1, 0 5Z"/>
  </g>
  <filter id="eg-emboss" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="-0.8" dy="-0.8" stdDeviation="0.4" flood-color="${C("door-hi")}" flood-opacity=".55"/>
    <feDropShadow dx="1" dy="1.2" stdDeviation="0.6" flood-color="${C("door-shadow")}" flood-opacity=".55"/>
  </filter>
  <pattern id="eg-leaf-pattern" width="150" height="170" patternUnits="userSpaceOnUse">
    <g fill="${C("door-leaf")}" stroke="${C("door-leaf")}" filter="url(#eg-emboss)">
      <use href="#eg-sprig" transform="translate(30 80) rotate(-25)"/><use href="#eg-sprig" transform="translate(115 60) rotate(30) scale(.85)"/>
      <use href="#eg-sprig" transform="translate(95 160) rotate(-60) scale(.9)"/><use href="#eg-sprig" transform="translate(20 165) rotate(40) scale(.75)"/>
    </g>
  </pattern>
  <linearGradient id="eg-drape-g" x1="0" x2="1">
    <stop offset="0" stop-color="${C("fab-3")}"/><stop offset=".15" stop-color="${C("fab-1")}"/><stop offset=".3" stop-color="${C("fab-4")}"/>
    <stop offset=".45" stop-color="${C("fab-1")}"/><stop offset=".62" stop-color="${C("fab-4")}"/><stop offset=".8" stop-color="${C("fab-2")}"/>
    <stop offset="1" stop-color="${C("fab-3")}"/>
  </linearGradient>
  <linearGradient id="eg-swag-g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C("fab-1")}"/><stop offset=".6" stop-color="${C("fab-2")}"/><stop offset="1" stop-color="${C("fab-3")}"/>
  </linearGradient>
  <g id="eg-drape">
    <path d="M0 0 H112 C 104 90, 80 170, 48 228 C 70 300, 92 380, 104 470 L 0 480 Z" fill="url(#eg-drape-g)"/>
    <path d="M22 0 C 24 80, 30 160, 40 226 M48 0 C 46 90, 44 160, 44 226 M74 0 C 66 90, 56 160, 46 226 M95 0 C 86 100, 66 170, 48 228" class="drape-folds" stroke-width="1.2" fill="none" opacity=".75"/>
    <path d="M44 236 C 46 310, 40 390, 30 476 M50 236 C 62 310, 72 390, 80 472" class="drape-folds" stroke-width="1.2" fill="none" opacity=".7"/>
    ${drapeBeads}
    <ellipse class="tieback" cx="46" cy="230" rx="16" ry="7"/>
  </g>
</defs>`;
}

/** Top valance: one swag per ~120px of width so they never look stretched. */
export function valance(width: number): { viewBox: string; markup: string } {
  const n = Math.max(3, Math.round(width / 120) || 4), w = 100, total = n * w;
  let s = `<rect class="valance-rod" x="0" y="0" width="${total}" height="10"/>`;
  for (let i = 0; i < n; i++) {
    const x0 = i * w - 6, x1 = (i + 1) * w + 6, xm = (x0 + x1) / 2;
    s += `<path d="M${x0} 6 Q${xm} 112 ${x1} 6 Z" fill="url(#eg-swag-g)" stroke="${C("fab-fold")}" stroke-width=".6"/>
      <path d="M${x0 + 8} 8 Q${xm} 88 ${x1 - 8} 8" fill="none" stroke="${C("fab-fold")}" stroke-width="1"/>
      <path d="M${x0 + 16} 8 Q${xm} 66 ${x1 - 16} 8" fill="none" stroke="${C("fab-fold")}" stroke-width="1"/>
      <path d="M${x0 + 26} 8 Q${xm} 42 ${x1 - 26} 8" fill="none" stroke="${C("fab-fold")}" stroke-width=".9"/>`;
    s += beads([[[x0 + 2, 9], [xm, 110], [x1 - 2, 9]]], 6.2, 2.3);
  }
  for (let i = 0; i <= n; i++) {
    const x = i * w;
    s += `<circle cx="${x}" cy="9" r="6.5" fill="${C("trim-1")}" stroke="${C("trim-2")}"/><circle cx="${x}" cy="9" r="3" fill="${C("trim-2")}"/>
      <path d="M${x} 15 v14" stroke="${C("trim-2")}" stroke-width="1.4"/>
      <path d="M${x - 3} 29 h6 l-1 9 h-4z" fill="${C("trim-1")}" stroke="${C("trim-2")}" stroke-width=".6"/>`;
  }
  return { viewBox: `0 0 ${total} 90`, markup: s };
}

/** Garden with fountain, cypresses, pillars and roses; wider screens get more garden at the sides. */
export function garden(ratio: number): { viewBox: string; markup: string } {
  const R = rng(7);
  const W = Math.max(400, Math.round(300 * ratio));
  const ox = (W - 400) / 2;
  let s = `<defs>
    <linearGradient id="eg-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C("g-water-1")}"/><stop offset="1" stop-color="${C("g-water-2")}"/></linearGradient>
    <linearGradient id="eg-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C("g-stone-1")}"/><stop offset="1" stop-color="${C("g-stone-2")}"/></linearGradient>
    <linearGradient id="eg-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C("g-ground-1")}"/><stop offset="1" stop-color="${C("g-ground-2")}"/></linearGradient>
    <radialGradient id="eg-rose-c" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="${C("g-rose-a1")}"/><stop offset="1" stop-color="${C("g-rose-a2")}"/></radialGradient>
    <radialGradient id="eg-rose-p" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="${C("g-rose-b1")}"/><stop offset="1" stop-color="${C("g-rose-b2")}"/></radialGradient>
  </defs>
  <path d="M0 232 Q${W / 2} 200 ${W} 232 V300 H0Z" fill="url(#eg-ground)"/>`;

  const cypress = (x: number, base: number, h: number, w: number) => {
    let p = `<path d="M${f2(x)} ${base} C${f2(x - w)} ${f2(base - h * 0.25)} ${f2(x - w * 0.7)} ${f2(base - h * 0.75)} ${f2(x)} ${f2(base - h)}
      C${f2(x + w * 0.7)} ${f2(base - h * 0.75)} ${f2(x + w)} ${f2(base - h * 0.25)} ${f2(x)} ${base}Z" fill="${C("g-tree")}"/>`;
    for (let i = 0; i < h / 7; i++) {
      const yy = base - 6 - R() * (h - 14), xx = x + (R() - 0.5) * w * 0.9;
      p += `<path d="M${f2(xx - 3)} ${f2(yy)} q3 -4 6 0" stroke="${C("g-tree-hi")}" stroke-width="1.1" fill="none"/>`;
    }
    return p;
  };
  s += cypress(22, 222, 165, 17) + cypress(W - 22, 222, 165, 17);
  s += cypress(56, 210, 118, 13) + cypress(W - 56, 210, 118, 13);
  for (let x = 118; x < ox + 40; x += 70 + R() * 40) {
    const h = 70 + R() * 90, w = 11 + R() * 6;
    s += cypress(x, 206, h, w) + cypress(W - x, 206, h, w);
  }
  s += `<g transform="translate(${f2(ox)} 0)">`;
  s += cypress(128, 196, 58, 9) + cypress(272, 196, 58, 9);
  s += `<rect x="96" y="186" width="56" height="22" rx="8" fill="${C("g-hedge")}"/><rect x="248" y="186" width="56" height="22" rx="8" fill="${C("g-hedge")}"/>`;
  const stone = `fill="url(#eg-stone)" stroke="${C("g-stone-line")}"`;
  const pillar = (x: number) => `
    <rect x="${x - 13}" y="150" width="26" height="8" rx="1" ${stone} stroke-width=".7"/>
    <rect x="${x - 10}" y="158" width="20" height="58" ${stone} stroke-width=".7"/>
    <rect x="${x - 14}" y="214" width="28" height="9" rx="1" ${stone} stroke-width=".7"/>
    <path d="M${x - 11} 136 h22 c0 9 -5 14 -11 14 c-6 0 -11 -5 -11 -14z" ${stone} stroke-width=".7"/>
    <circle cx="${x}" cy="124" r="15" fill="${C("g-tree")}"/><circle cx="${x - 5}" cy="119" r="7" fill="${C("g-tree-hi")}" opacity=".7"/>`;
  s += pillar(86) + pillar(314);
  s += `
    <ellipse cx="200" cy="240" rx="94" ry="22" fill="${C("g-stone-2")}" stroke="${C("g-stone-line")}" stroke-width=".8"/>
    <rect x="106" y="224" width="188" height="16" fill="${C("g-stone-2")}"/>
    <path d="M106 224 v16 M294 224 v16" stroke="${C("g-stone-line")}" stroke-width=".8"/>
    <ellipse cx="200" cy="224" rx="94" ry="24" ${stone} stroke-width=".9"/>
    <ellipse cx="200" cy="223" rx="83" ry="18" fill="url(#eg-water)"/>
    <ellipse cx="200" cy="225" rx="60" ry="11" fill="none" stroke="${C("g-ripple")}" stroke-width=".8" opacity=".7"/>
    <ellipse cx="200" cy="226" rx="36" ry="6.5" fill="none" stroke="${C("g-ripple")}" stroke-width=".8" opacity=".7"/>
    <path d="M193 226 L195 186 h10 L207 226z" ${stone} stroke-width=".7"/>
    <ellipse cx="200" cy="186" rx="27" ry="6.5" ${stone} stroke-width=".8"/>
    <ellipse cx="200" cy="185" rx="22" ry="4" fill="url(#eg-water)"/>
    <path d="M197 185 L198 164 h4 L203 185z" ${stone} stroke-width=".6"/>
    <ellipse cx="200" cy="164" rx="12" ry="3.4" ${stone} stroke-width=".7"/>
    <circle cx="200" cy="158" r="3.2" ${stone} stroke-width=".6"/>
    <g fill="none" stroke="${C("g-ripple")}" stroke-width="1.2" opacity=".9" class="water-arcs">
      <path d="M200 156 C190 150 184 160 182 182"/><path d="M200 156 C210 150 216 160 218 182"/>
      <path d="M176 187 C166 190 164 205 160 220"/><path d="M224 187 C234 190 236 205 240 220"/>
    </g>`;
  const leaf = (x: number, y: number, rot: number, sc = 1) =>
    `<path transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(rot)}) scale(${f2(sc)})" d="M0 0 C4 -5 12 -5 16 0 C12 5 4 5 0 0Z" fill="${R() > 0.5 ? C("g-leaf-1") : C("g-leaf-2")}"/>`;
  const rose = (x: number, y: number, r: number, pink: boolean) => {
    const line = pink ? C("g-rose-b-line") : C("g-rose-a-line");
    return `<g transform="translate(${f2(x)} ${f2(y)})"><circle r="${f2(r)}" fill="url(#eg-rose-${pink ? "p" : "c"})" stroke="${line}" stroke-width=".6"/>
      <path d="M${f2(-r * 0.5)} 0 a${f2(r * 0.5)} ${f2(r * 0.5)} 0 1 1 ${f2(r * 0.5)} ${f2(r * 0.5)} a${f2(r * 0.3)} ${f2(r * 0.3)} 0 1 1 ${f2(r * 0.1)} ${f2(-r * 0.55)}" fill="none" stroke="${line}" stroke-width=".7"/></g>`;
  };
  const filler = (x: number, y: number) => {
    let f = `<g transform="translate(${f2(x)} ${f2(y)})">`;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; f += `<circle cx="${f2(Math.cos(a) * 1.8)}" cy="${f2(Math.sin(a) * 1.8)}" r="1.5" fill="${C("g-filler")}"/>`; }
    return `${f}<circle r="1" fill="${C("g-filler-c")}"/></g>`;
  };
  const cluster = (cx: number, cy: number, n: number, sx: number, sy: number) => {
    let c = "";
    for (let i = 0; i < n * 2.2; i++) c += leaf(cx + (R() - 0.5) * sx * 2.2, cy + (R() - 0.5) * sy * 2, R() * 360, 0.8 + R() * 0.5);
    const items: [number, number, number, boolean][] = [];
    for (let i = 0; i < n; i++) items.push([cx + (R() - 0.5) * sx * 2, cy + (R() - 0.5) * sy * 2, 5 + R() * 5, R() < 0.35]);
    items.sort((a, b) => a[1] - b[1]).forEach(([x, y, r, p]) => (c += rose(x, y, r, p)));
    for (let i = 0; i < n * 0.8; i++) c += filler(cx + (R() - 0.5) * sx * 2.2, cy + (R() - 0.5) * sy * 2);
    return c;
  };
  s += cluster(86, 112, 5, 12, 6) + cluster(314, 112, 5, 12, 6);
  s += cluster(86, 222, 6, 18, 7) + cluster(314, 222, 6, 18, 7);
  s += cluster(124, 252, 7, 22, 8) + cluster(276, 252, 7, 22, 8);
  s += cluster(200, 290, 6, 30, 6);
  s += `</g>`;
  for (let x = 95; x < ox + 20; x += 85) {
    s += `<rect x="${x - 26}" y="214" width="52" height="20" rx="8" fill="${C("g-hedge")}"/><rect x="${f2(W - x - 26)}" y="214" width="52" height="20" rx="8" fill="${C("g-hedge")}"/>`;
    s += cluster(x, 250 + R() * 20, 9, 30, 12) + cluster(W - x, 250 + R() * 20, 9, 30, 12);
  }
  s += cluster(30, 268, 16, 38, 22) + cluster(W - 30, 268, 16, 38, 22);
  return { viewBox: `0 0 ${W} 300`, markup: s };
}

/** Illustrated placeholder slides (shown until the couple adds photos; never on the live site). */
export function slideArt(i: number): string {
  const pal = [C("slide-1"), C("slide-2"), C("slide-3")];
  const R = rng(11 + i * 13);
  let bokeh = "", flowers = "", drips = "";
  for (let k = 0; k < 28; k++) bokeh += `<circle cx="${f2(R() * 400)}" cy="${f2(R() * 300)}" r="${f2(4 + R() * 16)}" fill="${C("slide-light")}" opacity="${f2(0.15 + R() * 0.35)}"/>`;
  const fx = 150 + i * 30 + R() * 60, fy = 110 + R() * 40;
  for (let k = 0; k < 70; k++) {
    const a = R() * Math.PI * 2, d = Math.pow(R(), 0.7) * 70;
    const c = R() > 0.75 ? C("slide-flower-1") : R() > 0.3 ? C("slide-flower-2") : C("slide-flower-3");
    flowers += `<circle cx="${f2(fx + Math.cos(a) * d * 1.3)}" cy="${f2(fy + Math.sin(a) * d * 0.8)}" r="${f2(4 + R() * 9)}" fill="${c}" opacity=".95"/>`;
  }
  for (let k = 0; k < 40; k++) drips += `<circle cx="${f2(fx + (R() - 0.5) * 170)}" cy="${f2(fy + 40 + R() * 120)}" r="${f2(1 + R() * 2)}" fill="${C("slide-light")}" opacity=".8"/>`;
  const leaves = Array.from({ length: 16 }, () => `<ellipse cx="${f2(fx + (R() - 0.5) * 180)}" cy="${f2(fy + (R() - 0.5) * 110)}" rx="7" ry="2.5" transform="rotate(${f2(R() * 180)} ${f2(fx)} ${f2(fy)})"/>`).join("");
  return `<defs>
      <linearGradient id="eg-sg${i}" x1="${i % 2}" y1="0" x2="${1 - (i % 2)}" y2="1"><stop offset="0" stop-color="${pal[1]}"/><stop offset="1" stop-color="${pal[0]}"/></linearGradient>
      <filter id="eg-sb${i}"><feGaussianBlur stdDeviation="6"/></filter><filter id="eg-sf${i}"><feGaussianBlur stdDeviation="1.2"/></filter>
    </defs>
    <rect width="400" height="300" fill="url(#eg-sg${i})"/>
    <g filter="url(#eg-sb${i})">${bokeh}
      <path d="M0 0 C40 80 30 200 60 300 L0 300Z" fill="${C("slide-light")}" opacity=".55"/>
      <path d="M30 0 C70 90 60 200 95 300 L70 300 C40 200 50 90 10 0Z" fill="${C("slide-light")}" opacity=".35"/>
      <rect x="0" y="230" width="400" height="70" fill="${pal[2]}" opacity=".35"/>
    </g>
    <g filter="url(#eg-sf${i})">
      <path d="M${f2(fx)} ${f2(fy + 50)} L${f2(fx - 12)} 300 M${f2(fx)} ${f2(fy + 50)} L${f2(fx + 14)} 300" stroke="${pal[2]}" stroke-width="10" opacity=".5"/>
      ${flowers}${drips}<g fill="${C("slide-leaf")}" opacity=".55">${leaves}</g>
    </g>`;
}

/** Heart shape of the scratch card (viewBox 0 0 240 220). */
export const HEART = "M120 206 C 60 160, 10 120, 10 66 C 10 32, 36 10, 66 10 C 92 10, 110 26, 120 46 C 130 26, 148 10, 174 10 C 204 10, 230 32, 230 66 C 230 120, 180 160, 120 206 Z";

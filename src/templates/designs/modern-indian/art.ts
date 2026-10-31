/**
 * Modern Indian artwork, generated as SVG strings from the supplied design (template 002 script.js).
 * Colours are the theme's CSS variables (`fill="var(--accent)"`), so every theme recolours the same art and the
 * markup is identical on the server and in the browser. Only our own generated markup goes into these strings.
 */
import { rng } from "../shared/svg";

const V = (name: string) => `var(--${name})`;
const T = {
  p: V("primary"), p2: V("primary-2"), a: V("accent"), a2: V("accent-2"), pop: V("pop"), leaf: V("leaf"),
  paper: V("paper"), paper2: V("paper-2"), s1: V("sky-1"), s2: V("sky-2"), s3: V("sky-3"), s4: V("sky-4"),
  moon: V("moon"), win: V("window"), dk: V("palace"), dk2: V("water"),
};

const marigold = (x: number, y: number, r: number) => {
  let f = "";
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; f += `<circle cx="${(x + Math.cos(a) * r * 0.62).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.62).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="${T.a2}"/>`; }
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + 0.3; f += `<circle cx="${(x + Math.cos(a) * r * 0.38).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.38).toFixed(1)}" r="${(r * 0.34).toFixed(1)}" fill="${T.a}"/>`; }
  return f + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.3).toFixed(1)}" fill="${T.a2}"/>`;
};

/** An illustrated placeholder "photo" (shown until the couple adds their own). `id` must be unique on the page. */
export function art(type: number, seed: number, id: string): string {
  const R = rng(seed * 97 + 13);
  const open = `<svg viewBox="0 0 400 330" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;
  let s = "";
  switch (type % 6) {
    case 0: // dusk palace
      s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.s1}"/><stop offset=".6" stop-color="${T.s2}"/><stop offset=".85" stop-color="${T.s3}"/><stop offset="1" stop-color="${T.s4}"/></linearGradient></defs>
        <rect width="400" height="330" fill="url(#${id})"/><circle cx="${(110 + R() * 180).toFixed(1)}" cy="90" r="24" fill="${T.moon}" opacity=".9"/>
        <path fill="${T.dk}" d="M0 330 V250 H40 V215 h6 v-10 a10 10 0 0 1 20 0 v10 h6 V250 H150 V205 c0 -24 22 -42 50 -50 c28 8 50 26 50 50 V250 H330 V215 h6 v-10 a10 10 0 0 1 20 0 v10 h6 V250 H400 V330Z"/>
        <rect x="190" y="215" width="20" height="35" rx="10" fill="${T.win}"/><rect y="290" width="400" height="40" fill="${T.dk2}"/>
        <path d="M120 304h40M200 304h60M150 318h80" stroke="${T.win}" stroke-width="1.5" opacity=".7"/>`;
      break;
    case 1: // marigold heap
      s = `<defs><radialGradient id="${id}" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${T.a}"/><stop offset="1" stop-color="${T.a2}"/></radialGradient></defs><rect width="400" height="330" fill="url(#${id})"/>`;
      for (let i = 0; i < 26; i++) {
        const x = R() * 420 - 10, y = R() * 350 - 10;
        s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} c10 -14 26 -14 34 -4 c-12 10 -24 12 -34 4z" fill="${R() > 0.5 ? T.leaf : T.dk2}" transform="rotate(${(R() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      for (let i = 0; i < 16; i++) s += marigold(R() * 420 - 10, R() * 350 - 10, 18 + R() * 22);
      break;
    case 2: // lanterns at night
      s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.dk}"/><stop offset="1" stop-color="${T.dk2}"/></linearGradient><filter id="${id}b"><feGaussianBlur stdDeviation="7"/></filter></defs>
        <rect width="400" height="330" fill="url(#${id})"/><g filter="url(#${id}b)">`;
      for (let i = 0; i < 18; i++) s += `<circle cx="${(R() * 400).toFixed(1)}" cy="${(R() * 330).toFixed(1)}" r="${(6 + R() * 18).toFixed(1)}" fill="${R() > 0.4 ? T.a : T.pop}" opacity="${(0.25 + R() * 0.4).toFixed(2)}"/>`;
      s += `</g>`;
      for (let i = 0; i < 7; i++) {
        const x = (30 + i * 56 + R() * 16).toFixed(1), y = 70 + R() * 130;
        s += `<path d="M${x} 0 V${y.toFixed(1)}" stroke="${T.moon}" stroke-width=".8" opacity=".6"/><circle cx="${x}" cy="${(y + 18).toFixed(1)}" r="30" fill="${T.a}" opacity=".18"/><path d="M${+x - 11} ${y.toFixed(1)} h22 l-4 34 h-14z" fill="${T.a}"/><path d="M${+x - 7} ${(y + 34).toFixed(1)} h14" stroke="${T.a2}" stroke-width="3"/>`;
      }
      break;
    case 3: { // rangoli
      s = `<rect width="400" height="330" fill="${T.paper2}"/>`;
      const cx = 200, cy = 165;
      const rings: [number, number, string][] = [[120, 16, T.p], [92, 14, T.pop], [66, 12, T.a], [42, 10, T.leaf], [22, 8, T.a2]];
      rings.forEach(([r, n, c], ri) => {
        for (let k = 0; k < n; k++) { const a = (k / n) * 360 + ri * 9; s += `<ellipse cx="${cx}" cy="${(cy - r * 0.62).toFixed(1)}" rx="${(r * 0.16).toFixed(1)}" ry="${(r * 0.38).toFixed(1)}" fill="${c}" transform="rotate(${a.toFixed(1)} ${cx} ${cy})"/>`; }
      });
      s += `<circle cx="${cx}" cy="${cy}" r="10" fill="${T.pop}"/>`;
      for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; s += `<circle cx="${(cx + Math.cos(a) * 150).toFixed(1)}" cy="${(cy + Math.sin(a) * 150).toFixed(1)}" r="3" fill="${k % 2 ? T.a : T.p}"/>`; }
      break;
    }
    case 4: // lake & boat
      s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.s4}"/><stop offset=".55" stop-color="${T.paper}"/><stop offset="1" stop-color="${T.s2}"/></linearGradient></defs>
        <rect width="400" height="330" fill="url(#${id})"/><circle cx="${(140 + R() * 120).toFixed(1)}" cy="120" r="44" fill="${T.a}" opacity=".85"/>
        <path fill="${T.dk}" opacity=".55" d="M0 190 h60 v-20 a16 16 0 0 1 32 0 v20 h40 v-36 c0 -18 14 -30 32 -36 c18 6 32 18 32 36 v36 h60 v-16 a12 12 0 0 1 24 0 v16 H400 v12 H0z"/>
        <rect y="202" width="400" height="128" fill="${T.s2}" opacity=".85"/>
        <g stroke="${T.paper}" stroke-width="1.5" opacity=".5"><path d="M40 230h70M160 246h90M60 270h60M240 280h110M140 300h80"/></g>
        <path d="M230 250 h80 l-12 14 h-56z" fill="${T.dk}"/><path d="M268 250 V214 l22 30z" fill="${T.paper}"/>`;
      break;
    default: { // nested arches
      s = `<rect width="400" height="330" fill="${T.s4}"/><rect y="250" width="400" height="80" fill="${T.paper2}"/>`;
      const arches: [string, number][] = [[T.p, 0], [T.a, 22], [T.pop, 44], [T.leaf, 66], [T.paper2, 88]];
      for (const [c, d] of arches) {
        const x0 = 70 + d, x1 = 330 - d, top = 40 + d, mid = (x0 + x1) / 2;
        s += `<path d="M${x0} 330 V${top + 110} C${x0} ${top + 40} ${mid - 40} ${top} ${mid} ${top} C${mid + 40} ${top} ${x1} ${top + 40} ${x1} ${top + 110} V330Z" fill="${c}"/>`;
      }
      s += marigold(200, 220, 26);
    }
  }
  return open + s + "</svg>";
}

/** Bead garlands hanging inside the hero arch, and its stars. */
export function archGarlands(): string {
  let s = "";
  const strands: [number, number, number][] = [[44, 150, 13], [356, 150, 13], [70, 92, 8], [330, 92, 8]];
  for (const [x, y, n] of strands) {
    for (let k = 0; k < n; k++) s += `<circle cx="${x}" cy="${y + k * 11}" r="5.4" fill="${k % 2 ? V("g-2") : V("g-1")}"/>`;
    s += `<path d="M${x - 4} ${y + n * 11} h8 l-4 12z" fill="${V("g-bead")}"/>`;
  }
  return s;
}

export function archStars(): string {
  const R = rng(5);
  let st = "";
  for (let i = 0; i < 26; i++) st += `<circle cx="${(50 + R() * 300).toFixed(1)}" cy="${(40 + R() * 200).toFixed(1)}" r="${(0.5 + R() * 1.2).toFixed(2)}" opacity="${(0.4 + R() * 0.6).toFixed(2)}"/>`;
  return st;
}

/** The marigold toran hung across the top of the page, for a given width (segments stay evenly sized). */
export function toran(width: number): { viewBox: string; svg: string } {
  const W = Math.max(320, Math.round(width)), H = 74;
  const n = Math.max(3, Math.round(W / 150)), seg = W / n;
  let s = "";
  for (let i = 0; i < n; i++) {
    const x0 = i * seg, mx = x0 + seg / 2;
    for (let k = 0; k <= 14; k++) {
      const t = k / 14, x = x0 + seg * t, y = 5 + Math.sin(Math.PI * t) * 30;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.4" fill="${k % 2 ? V("g-2") : V("g-1")}"/>`;
    }
    s += `<path d="M${mx.toFixed(1)} 37 c-6 10 -6 20 0 28 c6 -8 6 -18 0 -28z" fill="${V("g-leaf")}"/>`
      + `<path d="M${(mx - 9).toFixed(1)} 35 c-8 6 -11 15 -9 23 c7 -4 10 -13 9 -23z" fill="${V("g-leaf-2")}"/>`
      + `<path d="M${(mx + 9).toFixed(1)} 35 c8 6 11 15 9 23 c-7 -4 -10 -13 -9 -23z" fill="${V("g-leaf-2")}"/>`
      + `<circle cx="${x0.toFixed(1)}" cy="6" r="7.5" fill="${V("g-bead")}"/>`;
  }
  s += `<circle cx="${W}" cy="6" r="7.5" fill="${V("g-bead")}"/>`;
  return { viewBox: `0 0 ${W} ${H}`, svg: s };
}

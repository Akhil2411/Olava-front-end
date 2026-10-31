/**
 * Riviera artwork, generated as SVG strings from the supplied design (template-riviera/script.js): the hero's
 * coastline and travel-poster placeholder illustrations. Colours are the design's CSS variables (the few
 * illustration-only tints are --art-* variables). Only our own generated markup goes into these strings.
 */
import type { ArtKind } from "../classic/Classic";
import { rng } from "../shared/svg";

const V = (n: string) => `var(--${n})`;
const RV = { navy: V("navy"), sea: V("sea"), seaD: V("art-sea-d"), seaL: V("sea-l"), terra: V("terra"), terraL: V("art-terra-l"), cliff: V("art-cliff"), cliffD: V("art-cliff-d"),
  peach: V("art-peach"), cream: V("art-cream"), pine: V("art-pine"), bougain: V("art-bougain"), lemon: V("art-lemon"), olive: V("art-olive"), stone: V("art-stone"), white: V("art-white") };
const HOUSES = [V("art-h1"), V("art-h2"), V("art-h3"), V("art-h4"), V("art-h5"), V("art-h6")];

/** The full-bleed coastline behind the hero (the sea glints; the picture drifts slowly). */
export function coast(): string {
  let s = `<defs><linearGradient id="rvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${RV.seaL}"/><stop offset=".55" stop-color="${V("art-haze")}"/><stop offset="1" stop-color="${RV.peach}"/></linearGradient>
    <linearGradient id="rvSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V("art-sea-m")}"/><stop offset="1" stop-color="${RV.seaD}"/></linearGradient></defs>
    <rect width="1440" height="900" fill="url(#rvSky)"/>
    <circle cx="1040" cy="430" r="70" fill="${RV.cream}" opacity=".95"/>
    <path d="M0 470 H1440 V900 H0Z" fill="url(#rvSea)"/>
    <g class="glint" stroke="${RV.cream}" stroke-width="2" opacity=".6"><path d="M960 500h160M990 525h110M1010 552h70M1030 578h40"/></g>`;
  let w = ""; for (let i = 0; i < 30; i++) { const x = (i * 157) % 1440, y = 520 + (i * 61) % 330; w += `<path d="M${x} ${y} q20 -6 40 0"/>`; }
  s += `<g stroke="${V("art-foam")}" stroke-width="1.4" opacity=".4" fill="none">${w}</g>`;
  s += `<path d="M0 900 V420 C120 400 210 360 300 380 C380 395 430 440 520 470 C600 500 640 560 700 600 C760 640 800 700 880 900Z" fill="${RV.cliff}"/>
        <path d="M0 900 V500 C140 470 260 470 360 500 C460 530 560 600 640 700 C690 760 730 830 760 900Z" fill="${RV.cliffD}"/>`;
  for (let i = 0; i < 40; i++) {
    const x = 180 + ((i * 71) % 360), y = 420 + ((i * 37) % 130) + (x - 180) * 0.25, bw = 26 + (i % 3) * 10, bh = 18 + (i % 4) * 6;
    s += `<rect x="${x}" y="${(y - bh).toFixed(1)}" width="${bw}" height="${bh}" fill="${HOUSES[i % 5]}"/><rect x="${x}" y="${(y - bh - 4).toFixed(1)}" width="${bw}" height="5" fill="${i % 2 ? RV.terra : RV.terraL}"/><rect x="${x + 6}" y="${(y - bh + 6).toFixed(1)}" width="5" height="7" fill="${RV.sea}"/>`;
  }
  s += `<path d="M290 430 v-46 l10 -12 l10 12 v46z" fill="${HOUSES[0]}"/><path d="M296 384 h8 v-16 h-8z" fill="${RV.terra}"/>`;
  for (const [x, y, h] of [[120, 500, 120], [150, 505, 90], [470, 560, 110], [60, 520, 140], [560, 620, 100]]) s += `<path d="M${x} ${y} c-10 -${(h * 0.33).toFixed(1)} -6 -${(h * 0.75).toFixed(1)} 6 -${h} c12 ${(h * 0.25).toFixed(1)} 16 ${(h * 0.67).toFixed(1)} 6 ${h}z" fill="${RV.pine}"/>`;
  s += `<rect x="0" y="800" width="1440" height="100" fill="${V("art-terrace")}"/><rect x="0" y="790" width="1440" height="14" fill="${V("art-ledge")}"/>`;
  for (let x = 0; x < 1440; x += 120) s += `<path d="M${x} 804 V900" stroke="${V("art-joint")}"/>`;
  for (let i = 0; i < 80; i++) { const x = 1060 + (i * 37) % 400, y = 650 + (i * 23) % 160; s += `<circle cx="${x}" cy="${y}" r="${7 + (i % 3) * 4}" fill="${i % 3 ? RV.bougain : V("art-bougain-l")}" opacity=".9"/>`; if (i % 4 === 0) s += `<path d="M${x} ${y} q14 -6 22 4 q-12 8 -22 -4z" fill="${RV.pine}"/>`; }
  return s + `<path d="M1250 470 l40 -10 l-8 10z M1255 460 v-40 l26 34z" fill="${RV.white}"/>`;
}

function draw(t: number, seed: number, id: string): string {
  const R = rng(seed * 59 + 5);
  const sky = (a = RV.seaL, b = RV.peach) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
  const houses = (x0: number, y0: number, n: number, w: number, slope: number) => {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + (i * 53) % w, y = y0 + Math.floor((i * 53) / w) * 34 + (x - x0) * slope, hw = 30 + (i % 3) * 10, hh = 24 + (i % 2) * 10;
      s += `<rect x="${x}" y="${y.toFixed(1)}" width="${hw}" height="${hh}" fill="${HOUSES[i % 6]}"/><rect x="${x + 7}" y="${(y + 8).toFixed(1)}" width="6" height="9" fill="${RV.sea}"/><rect x="${x}" y="${(y - 3).toFixed(1)}" width="${hw}" height="4" fill="${RV.terra}" opacity=".8"/>`;
    }
    return s;
  };
  const W = 400, H = 500;
  const open = (vb: string) => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;
  let s = open(`0 0 ${W} ${H}`);
  switch (t % 6) {
    case 0: { // long table under a pergola, the sea behind
      s = open("0 0 1050 400") + `${sky(V("art-sky-2"), RV.peach)}<rect width="1050" height="400" fill="url(#${id})"/>
        <rect y="200" width="1050" height="200" fill="${RV.sea}"/><path d="M0 230 H1050" stroke="${RV.white}" opacity=".3"/>
        <rect y="290" width="1050" height="110" fill="${V("art-terrace")}"/>`;
      for (let x = 60; x < 1050; x += 180) s += `<rect x="${x}" y="40" width="10" height="260" fill="${V("art-post")}"/>`;
      s += `<rect x="40" y="40" width="980" height="10" fill="${V("art-post")}"/>`;
      for (let i = 0; i < 90; i++) s += `<circle cx="${(R() * 1050).toFixed(0)}" cy="${(30 + R() * 50).toFixed(0)}" r="${(6 + R() * 8).toFixed(0)}" fill="${R() > 0.5 ? RV.pine : RV.olive}"/>`;
      for (let i = 0; i < 30; i++) s += `<circle cx="${(R() * 1050).toFixed(0)}" cy="${(40 + R() * 40).toFixed(0)}" r="4" fill="${RV.lemon}"/>`;
      s += `<rect x="140" y="270" width="770" height="14" fill="${RV.white}"/><rect x="140" y="284" width="770" height="30" fill="${V("art-cloth")}"/>`;
      for (let x = 170; x < 900; x += 60) s += `<path d="M${x} 270 v-14" stroke="${RV.navy}" stroke-width="2"/><circle cx="${x}" cy="252" r="4" fill="${RV.lemon}"/>`;
      return s + "</svg>";
    }
    case 1: s += sky() + `<rect width="${W}" height="${H}" fill="url(#${id})"/><path d="M0 500 V160 C120 150 220 220 300 300 C340 340 380 420 400 500Z" fill="${RV.cliff}"/>` + houses(20, 190, 34, 300, 0.5) + `<path d="M0 500 V440 H400 V500Z" fill="${RV.sea}"/><path d="M250 470 h50 l-8 10 h-34z" fill="${RV.white}"/>`; break;
    case 2:
      s += sky(V("art-sky-2"), V("art-sky-3")) + `<rect width="${W}" height="${H}" fill="url(#${id})"/><rect y="270" width="${W}" height="60" fill="${RV.sea}"/>
        <rect y="330" width="${W}" height="170" fill="${V("art-stone-2")}"/><rect y="300" width="${W}" height="10" fill="${HOUSES[0]}"/>`;
      for (let x = 10; x < W; x += 44) s += `<path d="M${x} 310 h20 c-6 8 -6 14 0 30 h-20 c6 -16 6 -22 0 -30z" fill="${V("art-baluster")}"/>`;
      s += `<path d="M30 300 v-40 h-10 l14 -30 h20 l14 30 h-10 v40z" fill="${HOUSES[0]}"/><circle cx="44" cy="214" r="22" fill="${RV.pine}"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${280 + i * 22} 300 c-8 -40 -4 -90 6 -120 c10 30 14 80 6 120z" fill="${RV.pine}"/>`;
      break;
    case 3:
      s += `<rect width="${W}" height="${H}" fill="${RV.sea}"/>`;
      for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H; s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q16 -6 32 0" stroke="${V("art-foam")}" stroke-width="2" fill="none" opacity=".55"/>`; }
      s += `<path d="M90 300 Q200 340 310 300 L290 340 Q200 360 110 340Z" fill="${RV.white}"/><path d="M96 312 Q200 348 304 312" stroke="${RV.navy}" stroke-width="7" fill="none"/><path d="M100 326 Q200 356 300 326" stroke="${RV.terra}" stroke-width="5" fill="none"/>
        <rect x="160" y="270" width="80" height="34" fill="${V("art-cloth")}"/><path d="M150 270 h100 l-8 -12 h-84z" fill="${RV.navy}"/><path d="M110 360 Q200 380 290 360" stroke="${RV.white}" opacity=".4" stroke-width="3" fill="none"/>`;
      break;
    case 4:
      s += `<rect width="${W}" height="${H}" fill="${HOUSES[0]}"/>`;
      for (let x = 0; x < W; x += 80) for (let y = 0; y < H; y += 80) s += `<rect x="${x + 2}" y="${y + 2}" width="76" height="76" fill="none" stroke="${RV.sea}" opacity=".35"/><circle cx="${x + 40}" cy="${y + 40}" r="10" fill="none" stroke="${RV.sea}" opacity=".35"/>`;
      for (let i = 0; i < 9; i++) { const x = 40 + R() * 320, y = 40 + R() * 420; s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} c18 -26 46 -26 60 -6 c-20 18 -42 20 -60 6z" fill="${RV.olive}" transform="rotate(${(R() * 360).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
      for (let i = 0; i < 8; i++) { const x = 50 + R() * 300, y = 50 + R() * 400; s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="30" ry="22" fill="${RV.lemon}" transform="rotate(${(R() * 60 - 30).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/><ellipse cx="${(x - 8).toFixed(0)}" cy="${(y - 6).toFixed(0)}" rx="8" ry="5" fill="${V("art-lemon-l")}"/>`; }
      break;
    default:
      s += sky(V("art-dusk"), V("art-dusk-2")) + `<rect width="${W}" height="${H}" fill="url(#${id})"/><circle cx="200" cy="270" r="70" fill="${V("art-sun")}"/><rect y="300" width="${W}" height="200" fill="${RV.seaD}"/>
        <g stroke="${V("art-sun")}" stroke-width="3" opacity=".7"><path d="M150 320h100M170 340h60M185 360h30"/></g><path d="M0 300 C60 270 110 280 150 300Z" fill="${RV.cliffD}"/>`;
  }
  return s + "</svg>";
}

const STORY = [1, 3, 2, 4, 5];
const GALLERY = [1, 3, 5, 2, 4, 0];
const TILES = [1, 2, 3, 4, 5];

export function art(kind: ArtKind, i: number, id: string): string {
  if (kind === "plate") return draw(0, i + 1, id);
  if (kind === "gallery") return draw(GALLERY[i % 6], i + 7, id);
  if (kind === "tile") return draw(TILES[i % 5], i + 2, id);
  return draw(STORY[i % 5], i + 3, id);
}

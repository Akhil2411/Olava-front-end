/**
 * Cinematic placeholder stills, generated as SVG strings from the supplied design (004 script.js "still()").
 * Shown until the couple adds photos; each theme tints them with CSS (--still-filter, --still-tint), as in the
 * supplied design. Only our own generated markup goes into these strings. `id` must be unique on the page.
 */
import { rng as seeded } from "../shared/svg";

export type StillKind = "palace" | "rain" | "lanterns" | "lake" | "ring" | "henna" | "sparklers" | "mandap" | "cameo" | "marigold";

// The supplied generator clamps the seed to at least 1 before seeding.
const rng = (seed: number) => seeded(Math.max(1, Math.floor(seed)) % 2147483647);

export function still(kind: StillKind, seed: number, id: string): string {
  const R = rng(seed * 101 + kind.length * 7);
  const W = 1200, H = 900;
  const bokeh = (n: number, cols: string[], y0 = 0, y1 = H, r0 = 6, r1 = 40) => { let s = `<g filter="url(#${id}b)">`; for (let i = 0; i < n; i++) s += `<circle cx="${(R() * W).toFixed(0)}" cy="${(y0 + R() * (y1 - y0)).toFixed(0)}" r="${(r0 + R() * (r1 - r0)).toFixed(0)}" fill="${cols[i % cols.length]}" opacity="${(.25 + R() * .6).toFixed(2)}"/>`; return s + `</g>`; };
  const defs = (stops: [number, string][], extra = "") => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>
    <filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="${id}s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>${extra}</defs>`;
  const leak = `<ellipse cx="${W * .9}" cy="${H * .1}" rx="420" ry="300" fill="#ff9a4a" opacity=".18" filter="url(#${id}b)"/>`;
  const vignette = `<rect width="${W}" height="${H}" fill="url(#${id}v)"/>`;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">`;
  switch (kind) {
    case "palace": {
      s += defs([[0, "#1a1020"], [.45, "#5b2c35"], [.72, "#c8693a"], [.86, "#f0a860"], [1, "#2a1712"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(26, ["#ffd9a0", "#ffb070", "#ffe7c4"], 0, 420, 2, 9)}
        <circle cx="820" cy="520" r="120" fill="#ffcf8a" opacity=".55" filter="url(#${id}b)"/>`;
      const pal = `M0 640 V560 H70 V500 h14 v-24 a22 22 0 0 1 44 0 v24 h14 V560 H260 V470 c0 -46 34 -78 80 -94 c46 16 80 48 80 94 V560 H520 V520 h18 v-30 a26 26 0 0 1 52 0 v30 h18 V560 H700 V430 c0 -54 40 -92 96 -112 c56 20 96 58 96 112 V560 H990 V500 h14 v-24 a22 22 0 0 1 44 0 v24 h14 V560 H${W} V640Z`;
      s += `<g transform="translate(240 230) scale(.6)"><path d="${pal}" fill="#1a0f0d"/><g fill="#ffc874">`;
      for (let i = 0; i < 26; i++) { const x = 40 + i * 44 + R() * 10, y = 580 + R() * 40; s += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="8" height="12" rx="4" opacity="${(.5 + R() * .5).toFixed(2)}"/>`; }
      s += `</g></g><rect y="614" width="${W}" height="${H - 614}" fill="#120a0a"/>
        <g transform="translate(240 230) scale(.6)"><path d="${pal}" fill="#2a1712" opacity=".55" transform="translate(0 1280) scale(1 -1)" filter="url(#${id}s)"/></g>`;
      for (let i = 0; i < 40; i++) { const x = R() * W, y = 630 + R() * 260; s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(30 + R() * 90).toFixed(0)}" ry="2" fill="#f0a860" opacity="${(.08 + R() * .25).toFixed(2)}"/>`; }
      for (let i = 0; i < 22; i++) { const x = R() * W, y = 690 + R() * 200; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="16" fill="#ffb25a" opacity=".35" filter="url(#${id}b)"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3" fill="#fff1c9"/>`; }
      s += leak; break; }
    case "rain": {
      s += defs([[0, "#0e1418"], [1, "#2a2420"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(40, ["#d9a85b", "#e9c9bd", "#8fb3c9", "#ffcf8a"], 0, H, 10, 50)}`;
      s += `<path d="M380 470 Q600 230 820 470 Q765 440 710 470 Q655 440 600 470 Q545 440 490 470 Q435 440 380 470Z" fill="#7a1f2b"/><path d="M600 470 V700 q0 40 -36 40 q-30 0 -30 -28" fill="none" stroke="#e9c9bd" stroke-width="8"/>`;
      for (let i = 0; i < 110; i++) { const x = R() * W, y = R() * H; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-7 22" stroke="#cfe0ee" stroke-width="1.3" opacity="${(.15 + R() * .35).toFixed(2)}"/>`; }
      break; }
    case "lanterns": {
      s += defs([[0, "#0c0a10"], [1, "#1e1416"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(50, ["#ffb35c", "#ff8a3c", "#ffd9a0"], 0, H, 8, 60)}`;
      for (let i = 0; i < 9; i++) { const x = 80 + i * 130 + R() * 40, y = 220 + R() * 340, sc = .7 + R() * .8; s += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${sc.toFixed(2)})"><path d="M0 -400 V-40" stroke="#ffcf8a" stroke-width="1" opacity=".4"/><circle r="70" fill="#ff9a3c" opacity=".25" filter="url(#${id}b)"/><path d="M-26 -40 h52 l-8 80 h-36z" fill="#ffb35c"/><path d="M-30 -46 h60 v8 h-60z M-14 40 h28" stroke="#7a4a24" stroke-width="4" fill="#7a4a24"/></g>`; }
      break; }
    case "lake": {
      s += defs([[0, "#f2b98c"], [.5, "#e9876a"], [.62, "#5b2c35"], [1, "#1a0f14"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/><circle cx="640" cy="430" r="90" fill="#ffe1b0" opacity=".9"/>
        <rect y="540" width="${W}" height="${H - 540}" fill="#3a1d24"/><g stroke="#ffd2a0" stroke-width="3" opacity=".5"><path d="M560 580h160M590 610h100M610 640h60"/></g>
        <path d="M0 540 h120 v-50 a30 30 0 0 1 60 0 v50 h120 v-80 c0 -36 26 -60 60 -72 c34 12 60 36 60 72 v80 h780" fill="#2a1418"/>
        <path d="M720 690 h200 l-30 26 h-140z" fill="#120a0a"/><path d="M820 690 v-60" stroke="#120a0a" stroke-width="4"/>`;
      s += leak; break; }
    case "ring": {
      s += defs([[0, "#1c1412"], [1, "#0d0a09"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(30, ["#d9a85b", "#f0cf91"], 0, H, 10, 50)}
        <path d="M300 760 Q600 690 900 760 V900 H300Z" fill="#e9dccb"/><path d="M600 700 V900" stroke="#c9b9a2" stroke-width="2"/>
        <g stroke="#e9dccb" stroke-width="1" opacity=".4">${Array.from({ length: 10 }, (_, i) => `<path d="M${340 + i * 26} ${770 - i * 2} Q${470 + i * 10} ${740} 590 ${712}"/>`).join("")}</g>
        <circle cx="600" cy="560" r="96" fill="none" stroke="#f0cf91" stroke-width="14"/><circle cx="600" cy="560" r="96" fill="none" stroke="#fff3d6" stroke-width="3" opacity=".6"/>
        <path d="M560 470 L600 420 L640 470 L600 486Z" fill="#fff8ec"/><circle cx="600" cy="452" r="70" fill="#fff6dc" opacity=".25" filter="url(#${id}b)"/>`;
      break; }
    case "henna": {
      s += defs([[0, "#3a2a14"], [1, "#1a140b"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(36, ["#9fbf4a", "#f2c94c", "#ffb35c"], 0, H, 10, 60)}`;
      s += `<path d="M380 900 C360 700 420 520 520 420 C560 380 640 380 670 420 C760 520 840 700 820 900Z" fill="#c99573"/>`;
      s += `<g fill="none" stroke="#6b2c14" stroke-width="3" opacity=".9"><circle cx="600" cy="560" r="60"/><circle cx="600" cy="560" r="36"/><circle cx="600" cy="560" r="12" fill="#6b2c14"/>`;
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; s += `<path d="M${(600 + Math.cos(a) * 66).toFixed(0)} ${(560 + Math.sin(a) * 66).toFixed(0)} q${(Math.cos(a) * 20).toFixed(0)} ${(Math.sin(a) * 20).toFixed(0)} ${(Math.cos(a + .3) * 30).toFixed(0)} ${(Math.sin(a + .3) * 30).toFixed(0)}"/>`; }
      s += `<path d="M520 720 q80 -40 160 0 M500 780 q100 -40 200 0 M490 840 q110 -40 220 0"/><path d="M560 460 c20 -30 60 -30 80 0" /></g>`;
      break; }
    case "sparklers": {
      s += defs([[0, "#140a22"], [1, "#2a1238"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(40, ["#c084fc", "#ffd27a", "#f472b6"], 0, H, 8, 50)}`;
      for (let k = 0; k < 7; k++) { const cx = 160 + k * 150 + R() * 40, cy = 260 + R() * 220; s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="60" fill="#ffd27a" opacity=".3" filter="url(#${id}b)"/>`; for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, l = 20 + R() * 70; s += `<path d="M${cx.toFixed(0)} ${cy.toFixed(0)} l${(Math.cos(a) * l).toFixed(0)} ${(Math.sin(a) * l).toFixed(0)}" stroke="#fff1c9" stroke-width="1.3" opacity="${(.4 + R() * .6).toFixed(2)}"/>`; } s += `<path d="M${cx.toFixed(0)} ${cy.toFixed(0)} l${(20 - R() * 40).toFixed(0)} 300" stroke="#3a2a40" stroke-width="3"/>`; }
      break; }
    case "mandap": {
      s += defs([[0, "#1a0d0c"], [1, "#3a1616"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(44, ["#ffb35c", "#ffe0a8", "#e9c9bd"], 0, 500, 6, 40)}`;
      s += `<g fill="#f3ebe0"><rect x="300" y="300" width="20" height="520"/><rect x="880" y="300" width="20" height="520"/></g><path d="M280 300 Q600 140 920 300" fill="none" stroke="#f3ebe0" stroke-width="16"/>`;
      for (let i = 0; i < 160; i++) { const t = R(), x = 280 + t * 640, y = 300 - Math.sin(t * Math.PI) * 150 + (R() - .5) * 40; s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + R() * 10).toFixed(0)}" fill="${R() > .5 ? "#f6f0e6" : "#e9a5a5"}"/>`; }
      for (let i = 0; i < 12; i++) { const x = 330 + i * 50; s += `<path d="M${x} ${300 - Math.sin((x - 280) / 640 * Math.PI) * 150 + 10} V${520 + R() * 60}" stroke="#f0a860" stroke-width="2" opacity=".6"/>`; }
      s += `<rect y="820" width="${W}" height="80" fill="#120808"/>`;
      break; }
    case "cameo": { // soft-lit portrait silhouette
      const hues = [["#2a1a14", "#5b3a2a"], ["#1c1614", "#4a2c2a"], ["#24180f", "#6b4a26"], ["#161214", "#3a2a30"], ["#2a1612", "#6b3426"], ["#1a1410", "#4a3a26"]][(seed - 1) % 6];
      s += defs([[0, hues[1]], [1, hues[0]]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(22, ["#ffd9a0", "#e9c9bd", "#ffb070"], 0, H, 14, 60)}
        <ellipse cx="600" cy="380" rx="300" ry="300" fill="#ffcf8a" opacity=".16" filter="url(#${id}b)"/>
        <path d="M300 900 C320 700 430 620 600 620 C770 620 880 700 900 900Z" fill="#120c0a"/>
        <ellipse cx="600" cy="430" rx="128" ry="156" fill="#120c0a"/>
        <path d="M700 330 C760 400 760 500 712 560" fill="none" stroke="#ffcf8a" stroke-width="5" opacity=".55" filter="url(#${id}s)"/>
        <path d="M800 690 C860 740 890 820 896 900" fill="none" stroke="#ffcf8a" stroke-width="5" opacity=".4" filter="url(#${id}s)"/>`;
      s += leak; break; }
    default: { // marigold petal rain
      s += defs([[0, "#2a1406"], [1, "#120a04"]]);
      s += `<rect width="${W}" height="${H}" fill="url(#${id})"/>${bokeh(30, ["#ffb020", "#ff7a1a"], 0, H, 20, 80)}`;
      for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H, r = 6 + R() * 14; s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${r.toFixed(0)}" ry="${(r * .55).toFixed(0)}" fill="${R() > .4 ? "#ffa31a" : "#ff7a1a"}" transform="rotate(${(R() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity="${(.5 + R() * .5).toFixed(2)}"/>`; }
    }
  }
  return s + vignette + `</svg>`;
}

/**
 * Ivory Letterpress artwork, generated as SVG strings from the supplied design
 * (template-ivory-letterpress/script.js): engraving-style placeholder illustrations in oval frames, and the
 * monogram crest. Colours are the design's CSS variables. Only our own generated markup goes into these strings.
 */
import type { RenderContext } from "../../types";
import type { ArtKind } from "../classic/Classic";
import { rng } from "../shared/svg";

const ink = "var(--ink)", gold = "var(--gold)", paper = "var(--paper)";
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const f = (n: number) => n.toFixed(1);

function draw(type: number, seed: number, id: string, initials: string): string {
  const R = rng(seed * 31 + 7);
  let s = `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="${gold}" stroke-width=".6" opacity=".35"/></pattern></defs>
    <rect width="300" height="400" fill="${paper}"/><rect width="300" height="400" fill="url(#${id})" opacity=".55"/>
    <ellipse cx="150" cy="200" rx="118" ry="160" fill="${paper}"/>`;
  const g = `fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
  switch (type) {
    case 0: // the umbrella in the rain
      s += `<g ${g}><path d="M60 190 Q150 80 240 190 Q217 176 195 190 Q172 176 150 190 Q128 176 105 190 Q83 176 60 190Z"/><path d="M150 112 V100"/><path d="M150 190 V292 q0 18 -16 18 q-14 0 -14 -14"/>
        <path d="M105 190 Q120 140 150 112 M195 190 Q180 140 150 112" stroke-width="1"/></g>`;
      for (let i = 0; i < 26; i++) { const x = 50 + R() * 200, y = 60 + R() * 280; if (y > 105 && y < 195 && x > 60 && x < 240) continue; s += `<path d="M${f(x)} ${f(y)} l-5 13" stroke="${gold}" stroke-width="1.2"/>`; }
      break;
    case 1: // letters with a wax seal
      s += `<g ${g}><rect x="74" y="210" width="150" height="96" transform="rotate(-8 150 258)"/><rect x="80" y="160" width="150" height="96" transform="rotate(6 150 208)" fill="${paper}"/>
        <rect x="70" y="120" width="160" height="104" fill="${paper}"/><path d="M70 120 L150 178 L230 120"/></g>
        <circle cx="150" cy="180" r="15" fill="${gold}"/><circle cx="150" cy="180" r="10" fill="none" stroke="${paper}" stroke-width=".8"/>
        <g stroke="${ink}" stroke-width=".8" opacity=".5"><path d="M92 200h50M92 210h38"/></g>`;
      break;
    case 2: // the ring on a cushion
      s += `<g ${g}><path d="M60 300 Q150 270 240 300 V318 Q150 290 60 318Z"/><path d="M150 284 V302"/>
        <ellipse cx="150" cy="210" rx="44" ry="46"/><ellipse cx="150" cy="210" rx="36" ry="38" stroke-width="1"/>
        <path d="M128 168 L150 140 L172 168 Z" fill="${paper}"/><path d="M128 168 L150 176 L172 168 M139 154 L150 176 L161 154" stroke-width="1"/></g>
        <g stroke="${gold}" stroke-width="1.2"><path d="M150 112 v-14 M124 122 l-9 -9 M176 122 l9 -9 M114 146 h-13 M186 146 h13"/></g>`;
      break;
    default: // initials in a laurel oval
      s += `<g fill="none" stroke="${gold}" stroke-width="1"><ellipse cx="150" cy="200" rx="96" ry="128"/><ellipse cx="150" cy="200" rx="88" ry="120" stroke-width=".5"/></g>`;
      for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
        const a = ((200 + i * 16) * Math.PI) / 180, x = 150 + side * Math.cos(a) * -78, y = 236 + Math.sin(a) * -92;
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="3" fill="${gold}" opacity=".85" transform="rotate(${side * (i * 16 - 40)} ${f(x)} ${f(y)})"/>`;
      }
      s += `<text x="150" y="222" text-anchor="middle" font-family="Monsieur La Doulaise, cursive" font-size="74" fill="${ink}">${initials}</text>`;
  }
  return s + "</svg>";
}

const two = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function art(kind: ArtKind, i: number, id: string, ctx: RenderContext, text?: string): string {
  if (kind === "person") return draw(3, i + 1, id, esc(two(text ?? "") || "♥"));
  const couple = esc(`${ctx.site.couple.partnerOneName.trim().slice(0, 1)}${ctx.site.couple.partnerTwoName.trim().slice(0, 1)}`.toUpperCase());
  if (kind === "gallery") return draw([0, 1, 2, 3][i % 4], i + 4, id, couple);
  return draw(i % 3, i + 1, id, couple);
}

/** The round crest with the couple's initials (header of the supplied design; here above the footer). */
export function crest(ctx: RenderContext): string {
  const a = esc(ctx.site.couple.partnerOneName.trim().slice(0, 1).toUpperCase());
  const b = esc(ctx.site.couple.partnerTwoName.trim().slice(0, 1).toUpperCase());
  return `<circle cx="30" cy="30" r="28"/><circle cx="30" cy="30" r="24.5" class="thin"/><text x="30" y="36" text-anchor="middle">${a}&amp;${b}</text>`;
}

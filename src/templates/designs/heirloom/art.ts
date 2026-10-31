/**
 * Heirloom artwork, generated as SVG strings from the supplied design (template-heirloom/script.js): the wreathed
 * monogram crest (drawn in gold during the opening) and engraved-plate placeholder illustrations in sepia and
 * burgundy. Colours are the design's CSS variables. Only our own generated markup goes into these strings.
 */
import type { RenderContext } from "../../types";
import type { ArtKind } from "../classic/Classic";
import { rng } from "../shared/svg";

const V = (n: string) => `var(--${n})`;
const HL = { burg: V("burg"), claret: V("claret"), gold: V("gold"), rose: V("rose"), page: V("page"), ink: V("ink"), sepia: V("sepia") };
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The crest with the couple's initials. `animated`: the rings draw in and the wreath fades in (the opening). */
export function crest(ctx: RenderContext, animated = false): string {
  const a = esc(ctx.site.couple.partnerOneName.trim().slice(0, 1).toUpperCase());
  const b = esc(ctx.site.couple.partnerTwoName.trim().slice(0, 1).toUpperCase());
  const d = animated ? ' class="draw" pathLength="1"' : "";
  const f = animated ? ' class="fill-in"' : "";
  let s = `<circle cx="100" cy="100" r="62" fill="none" stroke="${HL.gold}" stroke-width="1.2"${d}/><circle cx="100" cy="100" r="56" fill="none" stroke="${HL.gold}" stroke-width=".6"${d}/>`;
  s += `<path d="M100 178 C60 170 30 140 28 100 C26 70 40 46 60 32" fill="none" stroke="${HL.gold}" stroke-width="1.2"${d}/>`;
  s += `<path d="M100 178 C140 170 170 140 172 100 C174 70 160 46 140 32" fill="none" stroke="${HL.gold}" stroke-width="1.2"${d}/>`;
  let leaves = "";
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const t = i / 9, ang = ((100 + t * 130) * Math.PI) / 180, x = 100 + side * Math.cos(ang) * -74, y = 100 + Math.sin(ang) * 74;
    leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.6" fill="${i % 2 ? HL.claret : HL.gold}" opacity=".9" transform="rotate(${(side * (t * 130 + 10)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  s += `<g${f}>${leaves}<text x="100" y="116" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-size="50" fill="${HL.burg}">${a}<tspan font-size="30" fill="${HL.gold}" font-style="italic">&amp;</tspan>${b}</text>
    <path d="M76 182 q24 12 48 0" fill="none" stroke="${HL.gold}"/><circle cx="100" cy="189" r="3.4" fill="${HL.claret}"/></g>`;
  return s;
}

/** An engraved plate: the library steps (even) or a bridge at dusk (odd). */
function plate(type: number, seed: number, id: string): string {
  const R = rng(seed * 67 + 9);
  let s = `<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0V5" stroke="${HL.sepia}" stroke-width=".7"/></pattern></defs>
    <rect width="800" height="400" fill="${HL.page}"/><rect width="800" height="220" fill="url(#${id})" opacity=".55"/>`;
  const g = `fill="${HL.page}" stroke="${HL.ink}" stroke-width="1.4"`;
  if (type % 2 === 0) {
    s += `<path d="M180 320 V170 L400 90 L620 170 V320Z" ${g}/><path d="M180 170 H620" stroke="${HL.ink}" stroke-width="1.4"/>`;
    for (let x = 220; x <= 580; x += 60) s += `<rect x="${x - 10}" y="180" width="20" height="140" ${g}/>`;
    s += `<path d="M370 320 V250 a30 30 0 0 1 60 0 V320" fill="${HL.burg}" opacity=".85"/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${140 + i * 8}" y="${320 + i * 10}" width="${520 - i * 16}" height="10" ${g}/>`;
    s += `<path d="M560 300 Q600 250 640 300 Q627 292 614 300 Q600 292 586 300 Q573 292 560 300Z" fill="${HL.claret}"/><path d="M600 300 V350" stroke="${HL.ink}" stroke-width="2"/>`;
    for (let i = 0; i < 60; i++) { const x = R() * 800, y = R() * 300; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 11" stroke="${HL.ink}" stroke-width=".8" opacity=".35"/>`; }
  } else {
    s += `<rect y="250" width="800" height="150" fill="url(#${id})" opacity=".5"/><path d="M0 250 H800" stroke="${HL.ink}"/>`;
    s += `<path d="M60 250 Q400 120 740 250" fill="none" stroke="${HL.ink}" stroke-width="2"/>`;
    for (let x = 100; x < 720; x += 30) { const y = 250 - Math.sin(((x - 60) / 680) * Math.PI) * 130 * 0.9; s += `<path d="M${x} 250 V${y.toFixed(0)}" stroke="${HL.ink}" stroke-width=".8" opacity=".7"/>`; }
    s += `<path d="M60 250 V268 M740 250 V268" stroke="${HL.ink}" stroke-width="2"/>`;
    s += `<path d="M560 250 V60 l12 -30 l12 30 V250" ${g}/><path d="M540 250 L572 130 L604 250" fill="none" stroke="${HL.ink}"/>`;
    s += `<circle cx="${(140 + R() * 60).toFixed(0)}" cy="90" r="30" fill="${HL.rose}" opacity=".8"/>`;
    s += `<g fill="${HL.burg}"><circle cx="390" cy="160" r="7"/><path d="M383 168 h14 l4 30 h-22z"/><circle cx="414" cy="162" r="6.5"/><path d="M408 169 h13 l2 29 h-17z" fill="${HL.claret}"/></g>`;
  }
  return s + "</svg>";
}

/** A portrait placeholder: the crest wreath around one initial. */
function portrait(text: string, id: string) {
  const ini = esc(text.trim().slice(0, 1).toUpperCase() || "❧");
  let leaves = "";
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const t = i / 9, ang = ((100 + t * 130) * Math.PI) / 180, x = 100 + side * Math.cos(ang) * -74, y = 100 + Math.sin(ang) * 74;
    leaves += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="3.6" fill="${i % 2 ? HL.claret : HL.gold}" opacity=".9" transform="rotate(${(side * (t * 130 + 10)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0V5" stroke="${HL.sepia}" stroke-width=".7"/></pattern></defs>
    <rect width="200" height="200" fill="${HL.page}"/><rect width="200" height="200" fill="url(#${id})" opacity=".35"/>${leaves}
    <text x="100" y="118" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-size="60" fill="${HL.burg}">${ini}</text></svg>`;
}

export function art(kind: ArtKind, i: number, id: string, _ctx: RenderContext, text?: string): string {
  if (kind === "person") return portrait(text ?? "", id);
  return plate(kind === "story" ? i : i + 1, i + 1, id);
}

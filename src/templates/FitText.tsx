"use client";

import { useLayoutEffect, useRef } from "react";

/** Text smaller than this always fits (even a long word); not measured. */
const MIN_FONT_PX = 16;
/** Never shrink below this share of the design's size; past it, a word may break instead. */
const MIN_SCALE = 0.42;
/** Decorative text that must stay on one line (Modern Indian's moving ribbon) and editor chrome. */
const SKIP = ".marquee, [data-olv-nofit], .olv-edit-chip-row, .olv-sample-row, .sr-only, .olv-sr, script, style, svg, noscript";

type Fitted = HTMLElement & { dataset: { olvFitOrig?: string } };

/**
 * Keeps long names (and any other long word a couple types: a venue, a town) inside the design.
 *
 * Every design sizes the couple's names for typical names. After the site renders, this finds each piece of large
 * text whose longest word is wider than the space it has (its block, every box around it such as a card or an
 * arch, and the page itself) and scales that text down just enough, never below 42% of the design's size. Lines still wrap at
 * spaces. A single word that's still too wide at the smallest size may break as a last resort.
 *
 * It renders a hidden marker and works on the marker's parent (the element the site is rendered into), so it
 * needs no wrapper around the design and changes nothing else. It runs again when the width changes, when web
 * fonts finish loading, and when the content changes (typing in the editor).
 */
export function FitText() {
  const marker = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = marker.current?.parentElement;
    if (!root) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let width = -1;
    // At most one fit every 200 ms: a burst of changes (typing, an opening) costs one fit, and a design that keeps
    // changing classes can't keep pushing it back.
    const run = () => { if (timer === undefined) timer = setTimeout(() => { timer = undefined; fitAll(root); }, 200); };
    fitAll(root);
    // Web fonts arrive after the first paint (and some only when first used): fit again whenever one finishes.
    void document.fonts?.ready.then(run);
    document.fonts?.addEventListener?.("loadingdone", run);
    const resize = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w !== width) { width = w; run(); }
    });
    resize.observe(root);
    // Only changes to text matter (a name typed in the editor, a section added). Decorative animations that add and
    // remove empty elements (embers, petals), a ticking countdown (short text) and the measuring element's own
    // changes are ignored.
    const hasText = (nodes: NodeList) => Array.from(nodes).some((n) => (n.textContent ?? "").trim() !== "" && (n as Element).id !== "olv-fit-measure");
    const changes = new MutationObserver((records) => {
      if (records.some((r) => (r.type === "characterData" && r.target.parentElement?.id !== "olv-fit-measure" && (r.target.textContent ?? "").trim().length >= 6)
        || (r.type === "childList" && (hasText(r.addedNodes) || hasText(r.removedNodes)))
        // A class or `hidden` change on something with text: an opening finishing, a section revealed, a tab shown.
        || (r.type === "attributes" && (r.target.textContent ?? "").trim().length >= 6))) run();
    });
    changes.observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
    return () => { clearTimeout(timer); resize.disconnect(); changes.disconnect(); document.fonts?.removeEventListener?.("loadingdone", run); };
  }, []);

  return <span ref={marker} hidden data-olv-fit="" />;
}

/** Measures with an off-screen copy of the text's own font settings (letter-spacing, capitals, small caps…). */
function measurer(): HTMLSpanElement {
  let m = document.getElementById("olv-fit-measure") as HTMLSpanElement | null;
  if (!m) {
    m = document.createElement("span");
    m.id = "olv-fit-measure";
    m.setAttribute("aria-hidden", "true");
    m.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:pre;pointer-events:none";
    // No transitions: with "reduce motion" the site gives every element a tiny transition (for all properties), and a
    // font-size read straight after a change would still return the old size.
    m.style.setProperty("transition", "none", "important");
    m.style.setProperty("animation", "none", "important");
    document.documentElement.appendChild(m); // outside <body>: never part of what's observed
  }
  return m;
}

const COPY = ["fontFamily", "fontSize", "fontStyle", "fontWeight", "fontStretch", "fontVariant", "fontFeatureSettings",
  "fontVariationSettings", "letterSpacing", "wordSpacing", "textTransform", "fontKerning"] as const;

function wordWidth(m: HTMLSpanElement, cs: CSSStyleDeclaration, word: string): number {
  for (const k of COPY) m.style[k] = cs[k];
  m.textContent = word;
  return m.getBoundingClientRect().width;
}

/** A box you can see: it has a background, a border or a shadow. */
const framed = (cs: CSSStyleDeclaration) =>
  (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") || cs.backgroundImage !== "none"
  || parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderRightWidth) > 0 || cs.boxShadow !== "none";

const isInline = (cs: CSSStyleDeclaration) => cs.display === "inline" || cs.display === "contents";

function contentWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

/** The narrowest space the text really has: its block, every enclosing box, and the page. */
function available(el: HTMLElement, root: HTMLElement): number {
  // Shrink-to-fit boxes (inline-block words, inline-flex labels) are as wide as their text, so the space is
  // decided by the box around them.
  let block: HTMLElement | null = el;
  while (block && block !== root && (isInline(getComputedStyle(block)) || getComputedStyle(block).display.startsWith("inline-"))) block = block.parentElement;
  let bound = block ? contentWidth(block) : Infinity;
  // Boxes that clip, and boxes you can see (a card, a letter, a framed panel: background, border or shadow):
  // text spilling out of them is overflow. Transparent layout boxes don't count; designs let big headings hang
  // past those on purpose.
  for (let a = block?.parentElement ?? null; a && a !== root.parentElement; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (isInline(cs)) continue;
    const clips = cs.overflowX !== "visible";
    if (a.clientWidth <= 2) { if (clips) return 0; continue; } // screen-reader-only text: never fitted
    if (clips || framed(cs)) bound = Math.min(bound, contentWidth(a));
  }
  return Math.min(bound, root.clientWidth - 16);
}

/**
 * Whether the element's text runs past the page (inset 8px), a clipping box or (with `cards`) a visible card. Returns the factor its width
 * must shrink by to fit (e.g. 0.9), or null when it fits.
 */
function overflow(el: HTMLElement, root: HTMLElement, cards: boolean): number | null {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const page = root.getBoundingClientRect();
  let lo = page.left + 8, hi = page.right - 8;
  for (let a = el.parentElement; a && a !== root.parentElement; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (isInline(cs)) continue;
    const clips = cs.overflowX !== "visible";
    const box = a.getBoundingClientRect();
    if (box.width <= 2) { if (clips) return null; continue; } // screen-reader-only text / empty wrappers
    if (!clips && !(cards && framed(cs))) continue;
    // A clipping box cuts at its edge; a visible card at its edge too (text may use its padding, not spill out).
    lo = Math.max(lo, box.left); hi = Math.min(hi, box.right);
  }
  if (left >= lo - 2 && right <= hi + 2) return null; // italic overhang and rounding aren't overflow
  const width = right - left;
  // Shrinking keeps one edge (or the centre) in place, so fit the whole width and the side that's over.
  const factor = Math.min((hi - lo) / width, right > hi ? (hi - left) / width : 1, left < lo ? (right - lo) / width : 1);
  return factor > 0 && factor < 1 ? factor : null;
}

const ownText = (el: HTMLElement) =>
  Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent ?? "").join(" ");

function fitAll(root: HTMLElement) {
  // Undo the last fit first, so a wider screen or a shorter name gets the design's own size back.
  // Transitions are paused on the text being fitted (restored next frame), so sizes apply and read back at once.
  const paused = new Map<HTMLElement, string>();
  const pause = (el: HTMLElement) => { if (!paused.has(el)) { paused.set(el, el.style.transition); el.style.setProperty("transition", "none", "important"); } };
  const previous = root.querySelectorAll<Fitted>("[data-olv-fit-orig]");
  previous.forEach((el) => { pause(el); el.style.fontSize = el.dataset.olvFitOrig === "-" ? "" : el.dataset.olvFitOrig!; el.style.overflowWrap = ""; delete el.dataset.olvFitOrig; });

  const m = measurer();
  const changes: { el: Fitted; size: string; breakWords: boolean }[] = [];
  const checked: { el: Fitted; px: number }[] = [];
  const all = root.querySelectorAll<HTMLElement>("*");
  for (const el of all) {
    if (el.hidden || el.closest(SKIP)) continue;
    const text = ownText(el).trim();
    if (!text) continue;
    // Lines break only at ordinary spaces: names joined with non-breaking spaces count as one long word.
    const longest = text.split(/[ \t\n\r\f]+/).reduce((a, b) => (b.length > a.length ? b : a), "");
    if (longest.length < 6) continue; // short words always fit
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    // Hidden text (behind an opening animation, not revealed yet) is still laid out: fit it now, so it fits when shown.
    if (!(px >= MIN_FONT_PX) || cs.display === "none") continue;
    const nowrap = cs.whiteSpace === "nowrap" || cs.whiteSpace === "pre";
    checked.push({ el: el as Fitted, px });
    const need = wordWidth(m, cs, nowrap ? text.replace(/\s+/g, " ") : longest);
    const room = available(el, root);
    if (!(room > 0) || need <= room + 1.5) continue; // rounding and kerning aren't overflow
    const scale = Math.max(MIN_SCALE, (room * 0.97) / need);
    changes.push({ el: el as Fitted, size: `${(px * scale).toFixed(2)}px`, breakWords: need * scale > room });
  }
  // Write after reading, so the page is laid out once.
  for (const { el, size, breakWords } of changes) {
    pause(el);
    el.dataset.olvFitOrig = el.style.fontSize || "-";
    el.style.fontSize = size;
    if (breakWords) el.style.overflowWrap = "anywhere";
  }
  // Check where the text really landed: a box that sits off-centre or is wider than the screen can still push
  // fitted text past the edge. Shrink a little more where needed (up to three rounds, never below the floor).
  for (let round = 0; round < 3; round++) {
    const more: { el: Fitted; size: string; breakWords: boolean }[] = [];
    for (const { el, px } of checked) {
      // Any large text: never past the screen or a clipping frame. Text already being fitted: not past its card.
      const over = overflow(el, root, el.dataset.olvFitOrig !== undefined);
      if (!over) continue;
      const now = parseFloat(getComputedStyle(el).fontSize);
      const floor = px * MIN_SCALE;
      const next = Math.max(floor, now * over * 0.98);
      if (now - next < 0.25) { if (el.style.overflowWrap !== "anywhere") more.push({ el, size: `${now}px`, breakWords: true }); continue; }
      more.push({ el, size: `${next.toFixed(2)}px`, breakWords: next <= floor });
    }
    if (!more.length) break;
    for (const { el, size, breakWords } of more) {
      pause(el);
      if (el.dataset.olvFitOrig === undefined) el.dataset.olvFitOrig = el.style.fontSize || "-";
      el.style.fontSize = size;
      if (breakWords) el.style.overflowWrap = "anywhere";
    }
  }
  if (paused.size) requestAnimationFrame(() => paused.forEach((value, el) => { el.style.removeProperty("transition"); if (value) el.style.transition = value; }));
}

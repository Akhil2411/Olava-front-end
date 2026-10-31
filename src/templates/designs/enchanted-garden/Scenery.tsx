"use client";

import { useEffect, useRef, useState } from "react";
import { garden, valance } from "./art";

/** Re-draws generated artwork when its element changes size (wider screens get more swags / more garden). */
function useSize<T extends Element>(initial: { w: number; h: number }) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(t);
      t = setTimeout(() => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }), 120);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, []);
  return [ref, size] as const;
}

export function Valance() {
  const [ref, { w }] = useSize<SVGSVGElement>({ w: 390, h: 90 });
  const v = valance(w);
  return <svg ref={ref} className="valance" viewBox={v.viewBox} preserveAspectRatio="none" aria-hidden="true">
    <g className="swags" dangerouslySetInnerHTML={{ __html: v.markup }} />
  </svg>;
}

export function Garden() {
  const [ref, { w, h }] = useSize<SVGSVGElement>({ w: 390, h: 300 });
  const g = garden(w / Math.max(1, h));
  return <svg ref={ref} className="garden" viewBox={g.viewBox} preserveAspectRatio="xMidYMax meet" aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: g.markup }} />;
}

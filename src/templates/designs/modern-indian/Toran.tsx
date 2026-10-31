"use client";

import { useEffect, useRef, useState } from "react";
import { toran } from "./art";

/** The marigold garland across the top of the page; re-drawn for the page width so the beads stay round. */
export function Toran() {
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width) || 1200);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { viewBox, svg } = toran(width);
  return <svg ref={ref} className="toran" viewBox={viewBox} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

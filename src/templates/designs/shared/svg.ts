/** Small, dependency-free helpers for generated SVG artwork (shared by designs). */

/** Seeded random numbers, so generated illustrations look the same on every load (and on server and client). */
export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export type Pt = [number, number];
/** A path made of quadratic (3 points) or cubic (4 points) Bézier segments. */
export type Segment = [Pt, Pt, Pt] | [Pt, Pt, Pt, Pt];

function at(seg: Segment, t: number): Pt {
  const u = 1 - t;
  if (seg.length === 3) {
    const [a, b, c] = seg;
    return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
  }
  const [a, b, c, d] = seg;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

/** Points every `gap` units along the path (like getPointAtLength, but works on the server). */
export function pointsAlong(segments: Segment[], gap: number): Pt[] {
  const samples: Pt[] = [];
  for (const seg of segments) for (let i = 0; i <= 200; i++) samples.push(at(seg, i / 200));
  const out: Pt[] = [samples[0]];
  let carried = 0;
  for (let i = 1; i < samples.length; i++) {
    const [x0, y0] = samples[i - 1], [x1, y1] = samples[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    carried += len;
    if (carried >= gap) { out.push(samples[i]); carried = 0; }
  }
  return out;
}

/** A scalloped ellipse (badge outline). */
export function scallopPath(cx: number, cy: number, rx: number, ry: number, n: number, amp: number): string {
  let d = "";
  const steps = 360;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const k = 1 + amp * Math.abs(Math.sin((n * t) / 2));
    d += `${i ? "L" : "M"}${(cx + rx * k * Math.cos(t)).toFixed(2)} ${(cy + ry * k * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}

export const f2 = (n: number) => Math.round(n * 100) / 100;

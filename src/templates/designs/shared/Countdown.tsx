"use client";

import { useSyncExternalStore } from "react";

// One ticking clock for the whole page, shared by every countdown number.
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => { now = Date.now(); listeners.forEach((l) => l()); }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) { clearInterval(timer); timer = undefined; }
  };
}
const snapshot = () => now || Date.now();

export type CountdownUnit = "d" | "h" | "m" | "s";

/** Time left until `target` (ISO), split into units. Null on the server and once the moment has passed. */
export function remaining(target: string, at: number) {
  const diff = Math.max(0, new Date(target).getTime() - at) / 1000;
  const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60), s = Math.floor(diff % 60);
  return { d, h, m, s };
}

/** One live number of a countdown ("42"), two digits for hours/minutes/seconds. Renders "00" on the server. */
export function CountdownValue({ target, unit, pad = true }: { target: string; unit: CountdownUnit; pad?: boolean }) {
  const at = useSyncExternalStore(subscribe, snapshot, () => 0);
  if (!at) return <>{pad ? "00" : "0"}</>;
  const value = remaining(target, at)[unit];
  return <>{pad && unit !== "d" ? String(value).padStart(2, "0") : pad ? String(value).padStart(2, "0") : value}</>;
}

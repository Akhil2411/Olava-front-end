"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Reads a browser-only value without a hydration mismatch (server snapshot = fallback). */
export function useBrowserValue<T extends string | number | boolean | null>(read: () => T, fallback: T): T {
  return useSyncExternalStore(noop, read, () => fallback);
}

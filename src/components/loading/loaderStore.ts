"use client";

/**
 * Drives the section loader from in-app navigation (Next's useLinkStatus, reported by <TrackNavigation/>):
 * - nothing is shown if the next section is ready within SHOW_DELAY (fast switches stay instant);
 * - once shown, the loader stays at least MIN_VISIBLE, so it never flickers;
 * - it keeps going for as long as the navigation is pending, i.e. until the next section is actually rendered.
 */
export const SHOW_DELAY = 200;
export const MIN_VISIBLE = 400;
export const CYCLE = 2600;

let visible = false;
let pending = 0;
let shownAt = 0;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const setVisible = (v: boolean) => { if (visible !== v) { visible = v; listeners.forEach((l) => l()); } };

export const loaderStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  get: () => visible,
  server: () => false,

  /** A navigation started. */
  begin() {
    pending += 1;
    clearTimeout(hideTimer);
    if (visible || pending > 1) return;
    clearTimeout(showTimer);
    showTimer = setTimeout(() => { shownAt = Date.now(); setVisible(true); }, SHOW_DELAY);
  },
  /** A navigation finished (the new section has been rendered) or was cancelled. */
  end() {
    pending = Math.max(0, pending - 1);
    if (pending > 0) return;
    clearTimeout(showTimer);
    if (!visible) return;
    hideTimer = setTimeout(() => setVisible(false), Math.max(0, MIN_VISIBLE - (Date.now() - shownAt)));
  },
  /** Tests only. */
  reset() { clearTimeout(showTimer); clearTimeout(hideTimer); visible = false; pending = 0; shownAt = 0; listeners.clear(); },
};

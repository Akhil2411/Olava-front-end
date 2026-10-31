/**
 * Layout keys of the designs this web app can render (kept in sync with designs/registry.ts by a unit test).
 * Lightweight on purpose: the catalogue imports it without pulling in the designs themselves.
 */
export const DESIGN_KEYS = ["enchanted-garden", "modern-indian", "black-tie", "english-garden", "heirloom", "ivory-letterpress", "riviera", "cinematic"] as const;

export const isDesignReady = (layout: string) => (DESIGN_KEYS as readonly string[]).includes(layout);

import type { Template } from "@/lib/api/types";

/** Shown until the admin chooses (Admin → Home page): its photo opening and menu bar suit the showcase best. */
export const SHOWCASE_DEFAULT = "riviera";

/** The template the home page's laptop, tablet and phone all show: the admin's choice if it's offered, else the default. */
export function pickShowcase(templates: Template[], key: string | null | undefined): Template | null {
  return templates.find((t) => t.key === key) ?? templates.find((t) => t.key === SHOWCASE_DEFAULT) ?? templates[0] ?? null;
}

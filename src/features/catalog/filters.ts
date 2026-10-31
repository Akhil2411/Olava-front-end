import type { Template } from "@/lib/api/types";

/** Filters on the template gallery: the template type (category) and the pricing tier. "all" = no filter. */
export interface CatalogFilter {
  category: string;
  tier: string;
}

export const ALL = "all";
export const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface Group {
  category: string;
  slug: string;
  templates: Template[];
}

/** Templates grouped by category, groups in catalogue order (the order of their first template). */
export function groupByCategory(templates: Template[]): Group[] {
  const groups = new Map<string, Group>();
  for (const t of templates) {
    const category = t.category ?? "Other";
    const g = groups.get(category) ?? { category, slug: slug(category), templates: [] };
    g.templates.push(t);
    groups.set(category, g);
  }
  return [...groups.values()];
}

/** The pricing tiers present in the catalogue, cheapest first. */
export function tiersOf(templates: Template[]) {
  const tiers = new Map<string, NonNullable<Template["tier"]>>();
  for (const t of templates) if (t.tier) tiers.set(t.tier.code, t.tier);
  return [...tiers.values()].sort((a, b) => a.rank - b.rank);
}

export function applyFilter(templates: Template[], filter: CatalogFilter): Template[] {
  return templates.filter((t) =>
    (filter.category === ALL || slug(t.category ?? "Other") === filter.category) &&
    (filter.tier === ALL || t.tier?.code === filter.tier));
}

/** Reads ?type=…&price=… (unknown values fall back to "all"). */
export function parseFilter(templates: Template[], params: { type?: string | string[]; price?: string | string[] }): CatalogFilter {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ALL;
  const category = one(params.type);
  const tier = one(params.price);
  return {
    category: groupByCategory(templates).some((g) => g.slug === category) ? category : ALL,
    tier: tiersOf(templates).some((t) => t.code === tier) ? tier : ALL,
  };
}

export function filterQuery(filter: CatalogFilter): string {
  const q = new URLSearchParams();
  if (filter.category !== ALL) q.set("type", filter.category);
  if (filter.tier !== ALL) q.set("price", filter.tier);
  const s = q.toString();
  return s ? `?${s}` : "";
}

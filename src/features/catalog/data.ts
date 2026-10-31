import "server-only";
import { cache } from "react";
import { api } from "@/lib/api/server";
import type { Template, Tier } from "@/lib/api/types";
import { isDesignReady } from "@/templates/designs/available";

/** Templates change rarely (new versions are added by the team), so the catalogue is cached for 5 minutes. */
const CATALOG_TTL = 300;

/**
 * Public catalogue (anonymous API calls). Returns [] if the API is unreachable so marketing pages still render.
 * Only templates whose design this web app has are offered (the API may list a template before its design ships).
 */
export const getTemplates = cache(async (): Promise<Template[]> => {
  const result = await api<Template[]>("/api/v1/templates", { auth: false, revalidate: CATALOG_TTL });
  return result.ok ? result.data.filter((t) => isDesignReady(t.layout)) : [];
});

export async function getTemplate(key: string): Promise<Template | null> {
  const result = await api<Template>(`/api/v1/templates/${encodeURIComponent(key)}`, { auth: false });
  return result.ok ? result.data : null;
}

export async function getTiers(): Promise<Tier[]> {
  const result = await api<Tier[]>("/api/v1/pricing-tiers", { auth: false });
  return result.ok ? result.data : [];
}

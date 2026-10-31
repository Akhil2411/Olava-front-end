import "server-only";
import { cache } from "react";
import { api } from "@/lib/api/server";
import type { PublicSite } from "@/lib/api/types";

export type PublicLoad = { kind: "ok"; data: PublicSite } | { kind: "unavailable" } | { kind: "ended" } | { kind: "error" };

const SLUG = /^[a-z0-9-]{3,63}$/;

/** Published snapshot only (never drafts). Shared by the page and its metadata within one request. */
export const loadPublicSite = cache(async (slug: string): Promise<PublicLoad> => {
  if (!SLUG.test(slug)) return { kind: "unavailable" };
  const result = await api<PublicSite>(`/api/v1/public/sites/${slug}`, { auth: false });
  if (result.ok) return { kind: "ok", data: result.data };
  if (result.problem.status === 404) return { kind: "unavailable" };
  if (result.problem.status === 410) return { kind: "ended" };
  return { kind: "error" };
});

export function publicImageUrl(slug: string) {
  return (image: { ref: string }, variant: "large" | "thumb" | "audio" | "video") => `/api/public/sites/${slug}/media/${image.ref}/${variant}`;
}

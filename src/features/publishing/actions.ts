"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { PublishingStatus } from "@/lib/api/types";

/** The API checks ownership, entitlement, tier and expiry; this only relays the request. */
export async function publishAction(weddingId: string): Promise<ActionResult<PublishingStatus>> {
  if (!isId(weddingId)) return badRequest();
  const result = toAction(await api<PublishingStatus>(`/api/v1/weddings/${weddingId}/publish`, { method: "POST" }));
  revalidateWedding(weddingId);
  return result;
}

export async function unpublishAction(weddingId: string): Promise<ActionResult<PublishingStatus>> {
  if (!isId(weddingId)) return badRequest();
  const result = toAction(await api<PublishingStatus>(`/api/v1/weddings/${weddingId}/unpublish`, { method: "POST" }));
  revalidateWedding(weddingId);
  return result;
}

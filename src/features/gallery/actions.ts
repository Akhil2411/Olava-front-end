"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { Media } from "@/lib/api/types";

const PURPOSES = ["Gallery", "Hero", "Story", "EventCover", "Section"];

/** Forwards the file to the API, which decodes it, strips metadata and enforces type/size limits. */
export async function uploadMediaAction(weddingId: string, formData: FormData): Promise<ActionResult<Media>> {
  if (!isId(weddingId)) return badRequest();
  const file = formData.get("file");
  const purpose = String(formData.get("purpose") ?? "Gallery");
  if (!(file instanceof File) || file.size === 0) return badRequest("Choose an image to upload.");
  if (!PURPOSES.includes(purpose)) return badRequest();
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("purpose", purpose);
  const result = toAction(await api<Media>(`/api/v1/weddings/${weddingId}/media`, { form }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function updateCaptionAction(weddingId: string, mediaId: string, caption: string): Promise<ActionResult<Media>> {
  if (!isId(weddingId) || !isId(mediaId)) return badRequest();
  const result = toAction(await api<Media>(`/api/v1/weddings/${weddingId}/media/${mediaId}`, {
    method: "PATCH", body: { caption: String(caption ?? "").slice(0, 500) || null },
  }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function reorderGalleryAction(weddingId: string, ids: string[]): Promise<ActionResult<Media[]>> {
  if (!isId(weddingId) || !Array.isArray(ids) || !ids.every(isId)) return badRequest();
  const result = toAction(await api<Media[]>(`/api/v1/weddings/${weddingId}/media/gallery/order`, { method: "PUT", body: { ids } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function deleteMediaAction(weddingId: string, mediaId: string): Promise<ActionResult<null>> {
  if (!isId(weddingId) || !isId(mediaId)) return badRequest();
  const result = toAction(await api<null>(`/api/v1/weddings/${weddingId}/media/${mediaId}`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

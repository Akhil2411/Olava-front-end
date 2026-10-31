"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { CsvImportResult, Guest } from "@/lib/api/types";

export interface GuestInput {
  fullName: string; email?: string | null; phone?: string | null; groupName?: string | null;
  maxPlusOnes: number; notes?: string | null; rsvpStatus: string; plusOneCount: number; rsvpMessage?: string | null;
}

const blank = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const int = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);

export async function saveGuestAction(weddingId: string, guestId: string | null, input: GuestInput): Promise<ActionResult<Guest>> {
  if (!isId(weddingId) || (guestId !== null && !isId(guestId))) return badRequest();
  const body = {
    fullName: String(input.fullName ?? "").trim(), email: blank(input.email), phone: blank(input.phone),
    groupName: blank(input.groupName), maxPlusOnes: int(input.maxPlusOnes), notes: blank(input.notes),
    rsvpStatus: blank(input.rsvpStatus) ?? "pending", plusOneCount: int(input.plusOneCount), rsvpMessage: blank(input.rsvpMessage),
  };
  const path = `/api/v1/weddings/${weddingId}/guests${guestId ? `/${guestId}` : ""}`;
  const result = toAction(await api<Guest>(path, { method: guestId ? "PUT" : "POST", body }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function deleteGuestAction(weddingId: string, guestId: string): Promise<ActionResult<null>> {
  if (!isId(weddingId) || !isId(guestId)) return badRequest();
  const result = toAction(await api<null>(`/api/v1/weddings/${weddingId}/guests/${guestId}`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

/** dryRun=true validates only. Row errors come back in error.details.rowErrors (nothing imported). */
export async function importGuestsAction(weddingId: string, formData: FormData): Promise<ActionResult<CsvImportResult>> {
  if (!isId(weddingId)) return badRequest();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return badRequest("Choose a CSV file.");
  if (file.size > 1024 * 1024) return badRequest("CSV files must be 1 MB or smaller.");
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("dryRun", formData.get("dryRun") === "true" ? "true" : "false");
  form.set("duplicates", formData.get("duplicates") === "update" ? "update" : "skip");
  const result = toAction(await api<CsvImportResult>(`/api/v1/weddings/${weddingId}/guests/import`, { form }));
  if (result.ok && result.data.committed) revalidateWedding(weddingId);
  return result;
}

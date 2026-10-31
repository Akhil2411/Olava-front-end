"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { Venue, WeddingEvent } from "@/lib/api/types";

export interface VenueInput {
  name: string; addressLine?: string | null; city?: string | null; state?: string | null;
  postalCode?: string | null; mapUrl?: string | null;
}

export interface EventInput {
  name: string; eventType?: string | null; description?: string | null; startsAtLocal: string;
  endsAtLocal?: string | null; dressCode?: string | null; notes?: string | null; venueId?: string | null;
  coverMediaId?: string | null; isVisible: boolean;
}

const blank = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function saveVenueAction(weddingId: string, venueId: string | null, input: VenueInput): Promise<ActionResult<Venue>> {
  if (!isId(weddingId) || (venueId !== null && !isId(venueId))) return badRequest();
  const body = { name: String(input.name ?? "").trim(), addressLine: blank(input.addressLine), city: blank(input.city), state: blank(input.state), postalCode: blank(input.postalCode), mapUrl: blank(input.mapUrl) };
  const path = `/api/v1/weddings/${weddingId}/venues${venueId ? `/${venueId}` : ""}`;
  const result = toAction(await api<Venue>(path, { method: venueId ? "PUT" : "POST", body }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function deleteVenueAction(weddingId: string, venueId: string): Promise<ActionResult<null>> {
  if (!isId(weddingId) || !isId(venueId)) return badRequest();
  const result = toAction(await api<null>(`/api/v1/weddings/${weddingId}/venues/${venueId}`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function saveEventAction(weddingId: string, eventId: string | null, input: EventInput): Promise<ActionResult<WeddingEvent>> {
  if (!isId(weddingId) || (eventId !== null && !isId(eventId))) return badRequest();
  const body = {
    name: String(input.name ?? "").trim(), eventType: blank(input.eventType), description: blank(input.description),
    startsAtLocal: blank(input.startsAtLocal), endsAtLocal: blank(input.endsAtLocal), dressCode: blank(input.dressCode),
    notes: blank(input.notes), venueId: isId(input.venueId) ? input.venueId : null,
    coverMediaId: isId(input.coverMediaId) ? input.coverMediaId : null, isVisible: Boolean(input.isVisible),
  };
  const path = `/api/v1/weddings/${weddingId}/events${eventId ? `/${eventId}` : ""}`;
  const result = toAction(await api<WeddingEvent>(path, { method: eventId ? "PUT" : "POST", body }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function deleteEventAction(weddingId: string, eventId: string): Promise<ActionResult<null>> {
  if (!isId(weddingId) || !isId(eventId)) return badRequest();
  const result = toAction(await api<null>(`/api/v1/weddings/${weddingId}/events/${eventId}`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function reorderEventsAction(weddingId: string, ids: string[]): Promise<ActionResult<WeddingEvent[]>> {
  if (!isId(weddingId) || !Array.isArray(ids) || !ids.every(isId)) return badRequest();
  const result = toAction(await api<WeddingEvent[]>(`/api/v1/weddings/${weddingId}/events/order`, { method: "PUT", body: { ids } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

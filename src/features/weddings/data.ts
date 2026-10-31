import "server-only";
import { cache } from "react";
import { api } from "@/lib/api/server";
import { assertId, unwrap } from "@/lib/api/loaders";
import type { CheckoutQuote, Guest, GuestSummary, Media, MusicSettings, Order, Paged, PublishingStatus, SectionsResponse, Share, SiteModel, Venue, Wedding, WeddingEvent, WeddingSummary } from "@/lib/api/types";

// Server-only reads for the dashboard. Every call carries the session token; the API enforces ownership.

const w = (id: string) => `/api/v1/weddings/${assertId(id)}`;

export async function getWeddings(includeArchived = false) {
  return unwrap(await api<WeddingSummary[]>(`/api/v1/weddings${includeArchived ? "?includeArchived=true" : ""}`), "/dashboard");
}
/** De-duplicated per request (the layout and the page both need the wedding). */
export const getWedding = cache(async (id: string) => unwrap(await api<Wedding>(w(id)), `/dashboard/weddings/${id}`));
/** Sections and the "Add section" library. */
export async function getSectionsData(id: string) { return unwrap(await api<SectionsResponse>(`${w(id)}/sections`)); }
export async function getSections(id: string) { return (await getSectionsData(id)).sections; }
export async function getVenues(id: string) { return unwrap(await api<Venue[]>(`${w(id)}/venues`)); }
export async function getEvents(id: string) { return unwrap(await api<WeddingEvent[]>(`${w(id)}/events`)); }
export async function getMedia(id: string, purpose?: Media["purpose"]) {
  return unwrap(await api<Media[]>(`${w(id)}/media${purpose ? `?purpose=${purpose}` : ""}`));
}
export async function getPreview(id: string) { return api<SiteModel>(`${w(id)}/preview`); }
export async function getMusic(id: string) { return unwrap(await api<MusicSettings>(`${w(id)}/music`)); }
export async function getGuestSummary(id: string) { return unwrap(await api<GuestSummary>(`${w(id)}/guests/summary`)); }
export async function getGuests(id: string, query: { q?: string; status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (query.q) qs.set("q", query.q);
  if (query.status) qs.set("status", query.status);
  qs.set("page", String(query.page ?? 1));
  qs.set("pageSize", "50");
  return unwrap(await api<Paged<Guest>>(`${w(id)}/guests?${qs}`));
}
export async function getPublishing(id: string) { return unwrap(await api<PublishingStatus>(`${w(id)}/publishing`)); }
export async function getQuote(id: string) { return api<CheckoutQuote>(`${w(id)}/checkout/quote`); }
export async function getOrders(id: string) { return unwrap(await api<Order[]>(`${w(id)}/orders`)); }
export async function getShare(id: string) { return api<Share>(`${w(id)}/share`); }

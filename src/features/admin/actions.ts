"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { badRequest, isId, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { AdminTemplate, AdminTier, Faq, FeatureSwitches, HomeSettings, SiteInfo, TierInput } from "./types";

/** Every admin change re-renders the panel; changes guests or visitors see also refresh the public pages' cache. */
function done<T>(result: ActionResult<T>, publicToo = false): ActionResult<T> {
  if (result.ok) {
    revalidatePath("/admin", "layout");
    if (publicToo) { revalidateTag("catalog", "max"); revalidatePath("/", "layout"); }
  }
  return result;
}
const text = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");

// ───── Users ─────
export async function suspendUserAction(id: string, reason: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/users/${id}/suspend`, { body: { reason: text(reason) || null } })));
}
export async function reactivateUserAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/users/${id}/reactivate`, { method: "POST" })));
}
export async function setRolesAction(id: string, roles: string[]) {
  if (!isId(id) || !Array.isArray(roles)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/users/${id}/roles`, { method: "PUT", body: { roles: roles.map((r) => text(r, 40)) } })));
}
export async function deleteUserAction(id: string, confirmEmail: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/users/${id}/delete`, { body: { confirmEmail: text(confirmEmail, 300) } })), true);
}
export async function blockUserSitesAction(id: string, reason: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<{ blocked: number }>(`/api/v1/admin/users/${id}/block-sites`, { body: { reason: text(reason) } })));
}

// ───── Packages ─────
export async function saveTierAction(id: string | null, input: TierInput): Promise<ActionResult<AdminTier>> {
  if (id !== null && !isId(id)) return badRequest();
  const body = { ...input, features: (input.features ?? []).map((f) => text(f, 120)) };
  return done(toAction(await api<AdminTier>(id ? `/api/v1/admin/tiers/${id}` : "/api/v1/admin/tiers", { method: id ? "PUT" : "POST", body })), true);
}
export async function deleteTierAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/tiers/${id}`, { method: "DELETE" })), true);
}
export async function grantPackageAction(weddingId: string, tierCode: string, note: string) {
  if (!isId(weddingId)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/weddings/${weddingId}/package/grant`, { body: { tierCode: text(tierCode, 40), note: text(note, 300) || null } })));
}
export async function extendPackageAction(weddingId: string, until: string, note: string) {
  if (!isId(weddingId) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) return badRequest("Choose a date.");
  return done(toAction(await api<null>(`/api/v1/admin/weddings/${weddingId}/package/extend`, {
    body: { until: `${until}T23:59:00Z`, note: text(note, 300) || null },
  })));
}
export async function cancelPackageAction(weddingId: string, note: string) {
  if (!isId(weddingId)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/weddings/${weddingId}/package/cancel`, { body: { note: text(note, 300) || null } })));
}

// ───── Templates ─────
export async function createTemplateAction(input: { name: string; description: string; category: string; tierCode: string; sourceTemplateKey: string; theme: string; publish: boolean }) {
  return done(toAction(await api<AdminTemplate>("/api/v1/admin/templates", {
    body: { name: text(input.name, 80), description: text(input.description) || null, category: text(input.category, 60) || null,
      tierCode: text(input.tierCode, 40), sourceTemplateKey: text(input.sourceTemplateKey, 80), theme: text(input.theme, 80), publish: !!input.publish },
  })), true);
}
export async function updateTemplateAction(id: string, input: { name: string; description: string; category: string; tierCode: string; status: string }) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<AdminTemplate>(`/api/v1/admin/templates/${id}`, {
    method: "PUT",
    body: { name: text(input.name, 80), description: text(input.description) || null, category: text(input.category, 60) || null,
      tierCode: text(input.tierCode, 40), status: text(input.status, 10) },
  })), true);
}
export async function reorderTemplatesAction(ids: string[]) {
  if (!Array.isArray(ids) || !ids.every(isId)) return badRequest();
  return done(toAction(await api<null>("/api/v1/admin/templates/order", { method: "PUT", body: { ids } })), true);
}
export async function deleteTemplateAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/templates/${id}`, { method: "DELETE" })), true);
}
export async function moveTemplateWeddingsAction(id: string, toKey: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<{ moved: number }>(`/api/v1/admin/templates/${id}/move`, { body: { toKey: text(toKey, 80) } })), true);
}
export async function uploadThumbnailAction(id: string, formData: FormData) {
  if (!isId(id)) return badRequest();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return badRequest("Choose an image.");
  const form = new FormData();
  form.set("file", file, file.name);
  return done(toAction(await api<AdminTemplate>(`/api/v1/admin/templates/${id}/thumbnail`, { form })), true);
}
export async function clearThumbnailAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<AdminTemplate>(`/api/v1/admin/templates/${id}/thumbnail`, { method: "DELETE" })), true);
}

// ───── Home page & FAQs ─────
export async function saveHomeAction(settings: HomeSettings) {
  const keys = (v: unknown) => (typeof v === "string" && v ? text(v, 80) : null);
  return done(toAction(await api<HomeSettings>("/api/v1/admin/home", {
    method: "PUT",
    body: {
      featuredTemplates: (settings.featuredTemplates ?? []).map((k) => text(k, 80)).slice(0, 6),
      showcaseTemplate: keys(settings.showcaseTemplate),
    },
  })), true);
}
export async function saveFaqAction(id: string | null, input: { question: string; answer: string; isPublished: boolean }) {
  if (id !== null && !isId(id)) return badRequest();
  const body = { question: text(input.question, 300), answer: text(input.answer, 4000), isPublished: !!input.isPublished };
  return done(toAction(await api<Faq>(id ? `/api/v1/admin/faqs/${id}` : "/api/v1/admin/faqs", { method: id ? "PUT" : "POST", body })), true);
}
export async function deleteFaqAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/faqs/${id}`, { method: "DELETE" })), true);
}
export async function reorderFaqsAction(ids: string[]) {
  if (!Array.isArray(ids) || !ids.every(isId)) return badRequest();
  return done(toAction(await api<null>("/api/v1/admin/faqs/order", { method: "PUT", body: { ids } })), true);
}

// ───── Site details & switches ─────
export async function saveSiteInfoAction(info: SiteInfo) {
  const t = (v: unknown, max = 200) => text(v, max).trim() || null;
  return done(toAction(await api<SiteInfo>("/api/v1/admin/site", {
    method: "PUT",
    body: {
      siteName: text(info.siteName, 60), tagline: t(info.tagline, 120), contactEmail: t(info.contactEmail), contactPhone: t(info.contactPhone, 30),
      whatsApp: t(info.whatsApp, 30),
      social: { instagram: t(info.social?.instagram, 300), facebook: t(info.social?.facebook, 300), youTube: t(info.social?.youTube, 300),
        pinterest: t(info.social?.pinterest, 300), x: t(info.social?.x, 300) },
    },
  })), true);
}
export async function saveSwitchesAction(s: FeatureSwitches) {
  return done(toAction(await api<FeatureSwitches>("/api/v1/admin/switches", {
    method: "PUT", body: { emailSending: !!s.emailSending, emailVerification: !!s.emailVerification, googleSignIn: !!s.googleSignIn, signups: !!s.signups },
  })), true);
}

// ───── Sites & media ─────
export async function blockSiteAction(id: string, reason: string) {
  if (!isId(id)) return badRequest();
  if (!text(reason).trim()) return badRequest("Give a reason (kept in the activity log).");
  return done(toAction(await api<null>(`/api/v1/admin/sites/${id}/block`, { body: { reason: text(reason) } })));
}
export async function unblockSiteAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/sites/${id}/unblock`, { method: "POST" })));
}
export async function deleteMediaAction(id: string) {
  if (!isId(id)) return badRequest();
  return done(toAction(await api<null>(`/api/v1/admin/media/${id}`, { method: "DELETE" })));
}

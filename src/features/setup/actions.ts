"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { Section, SectionsResponse, SectionType, Wedding, WeddingSetup } from "@/lib/api/types";

const STATUSES = ["in_progress", "skipped", "done", "dismissed"];

/** Saves where the walkthrough is (resume point), or that it was skipped / finished / dismissed. */
export async function updateSetupAction(weddingId: string, status: WeddingSetup["status"], step?: string | null): Promise<ActionResult<WeddingSetup>> {
  if (!isId(weddingId) || !STATUSES.includes(status) || (step != null && !/^[a-z_]{2,40}$/.test(step))) return badRequest();
  const result = toAction(await api<WeddingSetup>(`/api/v1/weddings/${weddingId}/setup`, { method: "PUT", body: { status, step: step ?? null } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

/** Shows the chosen sections on the site and hides the other optional ones (nothing is deleted). */
export async function chooseSectionsAction(weddingId: string, sections: SectionType[]): Promise<ActionResult<WeddingSetup>> {
  if (!isId(weddingId) || !Array.isArray(sections) || sections.some((s) => typeof s !== "string")) return badRequest();
  const result = toAction(await api<WeddingSetup>(`/api/v1/weddings/${weddingId}/setup/sections`, { method: "PUT", body: { sections } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

/**
 * Saves one walkthrough form into its section: the answers are merged into the section's current content and
 * saved with its current revision (so it never overwrites a newer edit with stale data).
 */
export async function saveSetupSectionAction(weddingId: string, type: SectionType, patch: Record<string, unknown>): Promise<ActionResult<Section>> {
  if (!isId(weddingId) || typeof type !== "string" || typeof patch !== "object" || patch === null) return badRequest();
  const list = toAction(await api<SectionsResponse>(`/api/v1/weddings/${weddingId}/sections`));
  if (!list.ok) return list;
  const section = list.data.sections.find((s) => s.type === type);
  if (!section) return badRequest("This section isn't on your site any more.");
  const result = toAction(await api<Section>(`/api/v1/weddings/${weddingId}/sections/${section.id}`, {
    method: "PUT",
    body: { revision: section.revision, isEnabled: section.isEnabled, layoutVariant: section.layoutVariant, content: { ...section.content, ...patch } },
  }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

/** Step 1 again (going back): the names and date. Everything else about the wedding is kept. */
export async function updateCoupleAction(weddingId: string, input: { partnerOneName: string; partnerTwoName: string; weddingDate: string | null }): Promise<ActionResult<Wedding>> {
  if (!isId(weddingId)) return badRequest();
  const one = String(input.partnerOneName ?? "").trim(), two = String(input.partnerTwoName ?? "").trim();
  if (!one || !two || one.length > 100 || two.length > 100) return badRequest("Enter both names.");
  const date = input.weddingDate && /^\d{4}-\d{2}-\d{2}$/.test(input.weddingDate) ? input.weddingDate : null;
  const current = toAction(await api<Wedding>(`/api/v1/weddings/${weddingId}`));
  if (!current.ok) return current;
  const w = current.data;
  const sameTitle = w.title === `${w.partnerOneName} & ${w.partnerTwoName}`;
  const saved = toAction(await api<Wedding>(`/api/v1/weddings/${weddingId}`, {
    method: "PUT",
    body: {
      title: sameTitle ? `${one} & ${two}` : w.title, partnerOneName: one, partnerTwoName: two, weddingDate: date,
      timeZoneId: w.timeZoneId, preferredLanguage: w.preferredLanguage, contactEmail: w.contactEmail, contactPhone: w.contactPhone, slug: w.slug,
    },
  }));
  if (!saved.ok) return saved;
  revalidateWedding(weddingId);
  return saved;
}

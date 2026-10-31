"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { Section, SectionsResponse, SectionType, Wedding } from "@/lib/api/types";

export interface DesignResult {
  wedding: Wedding;
  sections: Section[];
  unsupportedSections: string[];
}

export async function updateDesignAction(weddingId: string, design: { templateKey: string; palette?: string | null; font?: string | null }): Promise<ActionResult<DesignResult>> {
  if (!isId(weddingId) || typeof design.templateKey !== "string") return badRequest();
  const result = toAction(await api<DesignResult>(`/api/v1/weddings/${weddingId}/design`, {
    method: "PUT",
    body: { templateKey: design.templateKey, palette: design.palette ?? null, font: design.font ?? null },
  }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

// ───────────── Sections v2: one change per call; the API validates every field ─────────────

const base = (weddingId: string) => `/api/v1/weddings/${weddingId}/sections`;

/** Adds a section (optionally after another). Content is optional; the API fills in the type's defaults. */
export async function addSectionAction(weddingId: string, type: SectionType, afterId?: string | null): Promise<ActionResult<Section>> {
  if (!isId(weddingId) || typeof type !== "string" || type.length > 64 || (afterId != null && !isId(afterId))) return badRequest();
  const result = toAction(await api<Section>(base(weddingId), { body: { type, afterId: afterId ?? null } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export interface SectionSave {
  revision: number;
  isEnabled: boolean;
  layoutVariant: string | null;
  content: Record<string, unknown>;
}

/**
 * Autosave of one section. A stale revision returns `section.conflict` with the current section in
 * `error.details.current`. Not revalidated on purpose: the editor keeps its own state, and every page
 * reads fresh data anyway.
 */
export async function updateSectionAction(weddingId: string, sectionId: string, save: SectionSave): Promise<ActionResult<Section>> {
  if (!isId(weddingId) || !isId(sectionId) || typeof save !== "object" || save === null) return badRequest();
  return toAction(await api<Section>(`${base(weddingId)}/${sectionId}`, {
    method: "PUT",
    body: {
      revision: Number(save.revision),
      isEnabled: Boolean(save.isEnabled),
      layoutVariant: save.layoutVariant ?? null,
      content: save.content ?? null,
    },
  }));
}

/**
 * Called once the host pauses editing (and when leaving the editor): refreshes cached dashboard pages so
 * the "changes aren't live yet" banner and the Publish tab reflect the autosaved draft.
 */
export async function syncDraftAction(weddingId: string): Promise<void> {
  if (isId(weddingId)) revalidateWedding(weddingId);
}

export async function deleteSectionAction(weddingId: string, sectionId: string): Promise<ActionResult<null>> {
  if (!isId(weddingId) || !isId(sectionId)) return badRequest();
  const result = toAction(await api<null>(`${base(weddingId)}/${sectionId}`, { method: "DELETE" }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

export async function reorderSectionsAction(weddingId: string, ids: string[]): Promise<ActionResult<SectionsResponse>> {
  if (!isId(weddingId) || !Array.isArray(ids) || ids.length > 60 || !ids.every(isId)) return badRequest();
  const result = toAction(await api<SectionsResponse>(`${base(weddingId)}/order`, { method: "PUT", body: { ids } }));
  if (result.ok) revalidateWedding(weddingId);
  return result;
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { Wedding } from "@/lib/api/types";
import { fromProblem, fromZod, formValues, type FormState } from "@/lib/forms";

const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.").or(z.literal("")).transform((v) => v || null);

const createSchema = z.object({
  partnerOneName: z.string().trim().min(1, "Enter a name.").max(100),
  partnerTwoName: z.string().trim().min(1, "Enter a name.").max(100),
  weddingDate: optionalDate,
  timeZoneId: z.string().trim().min(1).max(64),
  templateKey: z.string().trim().max(64).optional(),
});

export async function createWeddingAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);
  const result = await api<Wedding>("/api/v1/weddings", { body: { ...parsed.data, templateKey: parsed.data.templateKey || null } });
  if (!result.ok) return fromProblem(result.problem, values);
  // Straight on to the walkthrough's next step: choosing a design (a template link from the gallery is preselected).
  redirect(`/dashboard/setup/${result.data.id}?step=design`);
}

const updateSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200),
  partnerOneName: z.string().trim().min(1, "Enter a name.").max(100),
  partnerTwoName: z.string().trim().min(1, "Enter a name.").max(100),
  weddingDate: optionalDate,
  timeZoneId: z.string().trim().min(1).max(64),
  preferredLanguage: z.literal("en"),
  contactEmail: z.string().trim().max(256).email("Enter a valid email.").or(z.literal("")).transform((v) => v || null),
  contactPhone: z.string().trim().max(32).regex(/^\+?[0-9 ()-]{6,32}$/, "Enter a valid phone number.").or(z.literal("")).transform((v) => v || null),
  slug: z.string().trim().toLowerCase().min(3, "Use at least 3 characters.").max(63),
});

export async function updateWeddingAction(weddingId: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!isId(weddingId)) return { status: "error", message: "Unknown wedding." };
  const values = formValues(formData);
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);
  const result = await api<Wedding>(`/api/v1/weddings/${weddingId}`, { method: "PUT", body: parsed.data });
  if (!result.ok) {
    const state = fromProblem(result.problem, values);
    if (result.problem.code.startsWith("wedding.slug")) state.fieldErrors = { ...state.fieldErrors, slug: [result.problem.message] };
    if (result.problem.code === "wedding.invalid_time_zone") state.fieldErrors = { ...state.fieldErrors, timeZoneId: [result.problem.message] };
    return state;
  }
  revalidateWedding(weddingId);
  return { status: "success", message: "Saved.", values };
}

export async function archiveWeddingAction(weddingId: string, archive: boolean): Promise<ActionResult<Wedding>> {
  if (!isId(weddingId)) return badRequest();
  const result = toAction(await api<Wedding>(`/api/v1/weddings/${weddingId}/${archive ? "archive" : "restore"}`, { method: "POST" }));
  revalidateWedding(weddingId);
  return result;
}

export async function deleteWeddingAction(weddingId: string, confirmation: string): Promise<ActionResult<null>> {
  if (!isId(weddingId)) return badRequest();
  const result = await api<null>(`/api/v1/weddings/${weddingId}`, { method: "DELETE", body: { confirmation } });
  if (!result.ok) return toAction(result);
  revalidateWedding(weddingId);
  redirect("/dashboard?deleted=1");
}

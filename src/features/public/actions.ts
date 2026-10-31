"use server";

import { z } from "zod";
import { api } from "@/lib/api/server";
import { fromProblem, fromZod, formValues, type FormState } from "@/lib/forms";

const schema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z.string().trim().max(256).email("Enter a valid email.").or(z.literal("")).transform((v) => v || null),
  phone: z.string().trim().max(32).regex(/^\+?[0-9 ()-]{6,32}$/, "Enter a valid phone number.").or(z.literal("")).transform((v) => v || null),
  status: z.enum(["attending", "not_attending", "undecided"], { message: "Please choose a response." }),
  plusOneCount: z.coerce.number().int().min(0).max(20).default(0),
  message: z.string().trim().max(1000).optional().transform((v) => v || null),
  website: z.string().max(200).optional(), // honeypot
});

/** Anonymous RSVP. The API re-checks that the site is published, RSVP is open, and the plus-one limit. */
export async function submitRsvpAction(slug: string, _: FormState, formData: FormData): Promise<FormState> {
  if (!/^[a-z0-9-]{3,63}$/.test(slug)) return { status: "error", message: "This website isn't available." };
  const values = formValues(formData);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);
  const result = await api(`/api/v1/public/sites/${slug}/rsvp`, { body: parsed.data, auth: false });
  if (!result.ok) return fromProblem(result.problem, values);
  return { status: "success", message: parsed.data.status === "attending" ? "Thank you! We can't wait to celebrate with you." : "Thank you for letting us know." };
}

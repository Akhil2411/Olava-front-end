import type { ApiProblem } from "@/lib/api/problem";
import type { z } from "zod";

/** State shape for forms driven by useActionState. */
export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  /** Echo of submitted values so fields keep their content after a failed submit. */
  values?: Record<string, string>;
}

export const idle: FormState = { status: "idle" };

export function formValues(formData: FormData, ...omit: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !omit.includes(key) && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

export function fromZod(error: z.ZodError, values?: Record<string, string>): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { status: "error", message: "Please check the highlighted fields.", fieldErrors, values };
}

export function fromProblem(problem: ApiProblem, values?: Record<string, string>): FormState {
  return { status: "error", message: problem.message, fieldErrors: problem.fieldErrors, values };
}

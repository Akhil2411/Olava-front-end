import "server-only";
import { revalidatePath } from "next/cache";
import type { ActionResult, ApiProblem, ApiResult } from "./problem";
import { isId } from "./loaders";

export function toAction<T>(result: ApiResult<T>): ActionResult<T> {
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.problem };
}

export const badRequest = (message = "That request isn't valid."): ActionResult<never> =>
  ({ ok: false, error: { status: 400, code: "client.invalid", message } satisfies ApiProblem });

/** Re-renders every dashboard page of one wedding after a change (data is never cached, this refreshes the UI). */
export function revalidateWedding(weddingId: string) {
  revalidatePath(`/dashboard/weddings/${weddingId}`, "layout");
  revalidatePath("/dashboard");
}

export { isId };

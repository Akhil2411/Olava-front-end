import "server-only";
import { notFound, redirect } from "next/navigation";
import type { ApiProblem, ApiResult } from "./problem";

/** Thrown for unexpected API failures; caught by the nearest error.tsx boundary. */
export class ApiError extends Error {
  constructor(public problem: ApiProblem) {
    super(problem.message);
  }
}

/**
 * For Server Component reads: 401 → sign in again, 404 → not-found page (also used for other tenants'
 * resources, which the API reports as 404), anything else → error boundary.
 */
export function unwrap<T>(result: ApiResult<T>, next?: string): T {
  if (result.ok) return result.data;
  if (result.problem.status === 401) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  if (result.problem.status === 404) notFound();
  throw new ApiError(result.problem);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params go into API paths: only well-formed ids are accepted (no path tricks). */
export function assertId(id: string): string {
  if (!UUID.test(id)) notFound();
  return id;
}

export function isId(id: unknown): id is string {
  return typeof id === "string" && UUID.test(id);
}

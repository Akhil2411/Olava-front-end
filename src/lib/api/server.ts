import "server-only";
import { cookies, headers } from "next/headers";
import { env } from "@/lib/env";
import { ACCESS_COOKIE } from "@/lib/session/tokens";
import { networkProblem, toProblem, type ApiResult } from "./problem";

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. */
  body?: unknown;
  /** Multipart body (uploads). */
  form?: FormData;
  /** Attach the session's bearer token (default true). */
  auth?: boolean;
  /**
   * Public, anonymous GETs only: keep the response in Next's data cache for this many seconds
   * (e.g. the template catalogue). Anything with a session is never cached.
   */
  revalidate?: number;
  /** apiRaw only: a byte range to request (audio streaming). */
  range?: string | null;
}

/** Forward the visitor's IP so the API's per-IP rate limits apply to real clients, not to this server. */
async function forwardedFor(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
}

async function buildHeaders(options: ApiOptions): Promise<Headers> {
  const result = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) result.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const token = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (token) result.set("Authorization", `Bearer ${token}`);
  }
  // Cached public reads are shared across visitors, so they carry no visitor IP (it would also split the cache).
  const ip = options.revalidate === undefined ? await forwardedFor() : null;
  if (ip) result.set("X-Forwarded-For", ip);
  if (options.range && /^bytes=\d*-\d*$/.test(options.range)) result.set("Range", options.range);
  return result;
}

/**
 * Server-side call to the .NET API (the only place that talks to it). Never cached (except public catalogue
 * reads that pass `revalidate`): every other response
 * depends on the session or on live publish state. Never throws for HTTP/network failures.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: options.method ?? (options.body !== undefined || options.form ? "POST" : "GET"),
      headers: await buildHeaders(options),
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      ...(options.revalidate !== undefined && options.auth === false && !options.body && !options.form
        ? { next: { revalidate: options.revalidate, tags: ["catalog"] } }
        : { cache: "no-store" as const }),
    });
  } catch (ex) {
    console.log(ex)
    return { ok: false, problem: networkProblem() };
  }

  if (response.status === 204) return { ok: true, data: null as T };
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = null; }
  }
  if (!response.ok) return { ok: false, problem: toProblem(response.status, body) };
  return { ok: true, data: body as T };
}

/** Raw streaming call for files (images, CSV, QR). Used by Route Handlers that relay bytes to the browser. */
export async function apiRaw(path: string, options: ApiOptions = {}): Promise<Response | null> {
  try {
    return await fetch(`${env.apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers: await buildHeaders(options),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

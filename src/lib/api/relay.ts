import "server-only";
import { apiRaw } from "./server";

const PASS_HEADERS = ["content-type", "content-length", "etag", "cache-control", "content-disposition", "accept-ranges", "content-range"];

/**
 * Streams a file from the API to the browser. Only safe, known headers are copied. The API decides
 * authorisation; 401/403/404 are passed through as plain status codes (no internal details).
 */
export async function relay(path: string, options: { auth?: boolean; disposition?: string; range?: string | null } = {}): Promise<Response> {
  const upstream = await apiRaw(path, { auth: options.auth, range: options.range });
  if (!upstream) return new Response("Service unavailable", { status: 503 });
  if (!upstream.ok || !upstream.body) return new Response(null, { status: upstream.status === 410 ? 404 : upstream.status });

  const headers = new Headers({ "X-Content-Type-Options": "nosniff" });
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (options.disposition) headers.set("content-disposition", options.disposition);
  // 206 Partial Content passes through for range requests (audio/video seeking; Safari requires it for <audio>/<video>).
  return new Response(upstream.body, { status: upstream.status === 206 ? 206 : 200, headers });
}

export const VARIANTS = new Set(["large", "thumb", "audio", "video"]);
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TOKEN = /^[0-9a-f]{32}$/;
export const SLUG = /^[a-z0-9-]{3,63}$/;

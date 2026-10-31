import "server-only";

/**
 * Server-only configuration. Nothing here is exposed to the browser (no NEXT_PUBLIC_ prefix).
 * Values come from .env.local in development; see .env.example.
 */
function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value.replace(/\/+$/, "");
}

export const env = {
  /** Base URL of the Olava .NET API, reached server-to-server (never from the browser). */
  apiUrl: required("OLAVA_API_URL", "http://localhost:5033"),
  /** When set (e.g. "olava.in"), {slug}.{root} hosts are rewritten to /w/{slug}. */
  publicRootDomain: process.env.PUBLIC_ROOT_DOMAIN?.trim() || null,
  /** Secure cookies require HTTPS; defaults to on in production. */
  secureCookies: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true",
};

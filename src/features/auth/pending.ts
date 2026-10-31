/**
 * Short-lived, HttpOnly cookies that carry sign-in state between steps:
 *  - "olava_verify": who is confirming their email (address, where to go next, when "send a new code" opens).
 *    It isn't a credential: the emailed code is the proof, and the API checks it.
 *  - "olava_google": the OAuth `state` and PKCE verifier for one Google sign-in (10 minutes, callback path only).
 * No server-only import, so route handlers and server actions can both use it.
 */
export const VERIFY_COOKIE = "olava_verify";
export const GOOGLE_COOKIE = "olava_google";

export interface PendingVerification {
  email: string;
  next: string;
  /** Epoch ms when "send a new code" becomes available. */
  resendAt: number;
  /** Whether the last attempt to email a code succeeded. */
  sent: boolean;
}

export interface GoogleAttempt {
  state: string;
  verifier: string;
  next: string;
}

export function readJsonCookie<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export const encodeJsonCookie = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

export const pendingCookieOptions = (secure: boolean, maxAgeSeconds: number, path = "/") => ({
  httpOnly: true, secure, sameSite: "lax" as const, path, maxAge: maxAgeSeconds,
});

export function isPendingVerification(v: unknown): v is PendingVerification {
  const p = v as PendingVerification;
  return !!p && typeof p.email === "string" && typeof p.next === "string" && typeof p.resendAt === "number" && typeof p.sent === "boolean";
}

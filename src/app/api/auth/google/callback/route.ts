import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, readJsonCookie, type GoogleAttempt } from "@/features/auth/pending";
import { api } from "@/lib/api/server";
import type { AuthResponse } from "@/lib/api/types";
import { env } from "@/lib/env";
import { landingFor } from "@/lib/session/session";
import { writeSession } from "@/lib/session/tokens";

const ERRORS: Record<string, string> = {
  "auth.google_email_unverified": "google_unverified",
  "auth.google_disabled": "google_unavailable",
};

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Google sends the browser back here with ?code&state. The API swaps the code for a verified identity and a session. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const attempt = readJsonCookie<GoogleAttempt>(request.cookies.get(GOOGLE_COOKIE)?.value);
  const fail = (error: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    response.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return response;
  };

  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "google_cancelled" : "google");
  const code = params.get("code"), state = params.get("state");
  // The state must match the one this browser started with (stops forged or replayed callbacks).
  if (!attempt?.state || !attempt.verifier || !code || !state || !same(state, attempt.state)) return fail("google");

  const result = await api<AuthResponse>("/api/v1/auth/google", { body: { code, codeVerifier: attempt.verifier }, auth: false });
  if (!result.ok) return fail(ERRORS[result.problem.code] ?? "google");

  const response = NextResponse.redirect(new URL(result.data.isNewAccount ? "/dashboard/new" : landingFor(result.data.user, attempt.next), request.url));
  response.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
  writeSession(response.cookies, result.data, env.secureCookies);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

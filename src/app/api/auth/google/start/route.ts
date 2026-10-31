import { NextResponse, type NextRequest } from "next/server";
import { googleAuthorizeUrl, googleSignInConfig, newGoogleAttempt } from "@/features/auth/google";
import { GOOGLE_COOKIE, encodeJsonCookie, pendingCookieOptions, type GoogleAttempt } from "@/features/auth/pending";
import { env } from "@/lib/env";
import { requestedNext } from "@/lib/session/session";

/** "Continue with Google": remember state + PKCE verifier for 10 minutes, then send the browser to Google. */
export async function GET(request: NextRequest) {
  const config = await googleSignInConfig();
  if (!config) return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));

  const { state, verifier, challenge } = newGoogleAttempt();
  const attempt: GoogleAttempt = { state, verifier, next: requestedNext(request.nextUrl.searchParams.get("next")) };
  const response = NextResponse.redirect(googleAuthorizeUrl(config, state, challenge));
  response.cookies.set(GOOGLE_COOKIE, encodeJsonCookie(attempt), pendingCookieOptions(env.secureCookies, 600, "/api/auth/google"));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

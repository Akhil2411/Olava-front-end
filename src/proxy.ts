import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, needsRefresh, writeSession, type TokenPair } from "@/lib/session/tokens";

/**
 * Runs before every matched request:
 *  1. Subdomain hosting: {slug}.{PUBLIC_ROOT_DOMAIN} → /w/{slug} (only when the root domain is configured).
 *  2. Session refresh: if the access token is missing/expiring and a refresh token exists, rotate them via the
 *     API and pass the new cookies both to the browser AND to this request, so pages render with a fresh token.
 *  3. Route protection: /dashboard and /preview require a session (the API still authorises every call).
 */
const API_URL = (process.env.OLAVA_API_URL ?? "http://localhost:5033").replace(/\/+$/, "");
const ROOT_DOMAIN = process.env.PUBLIC_ROOT_DOMAIN?.trim() || null;
const SECURE = (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true";
const PROTECTED = ["/dashboard", "/preview"];
const AUTH_PAGES = ["/login", "/register", "/verify-email"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Subdomain → public site
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = host.slice(0, -(ROOT_DOMAIN.length + 1));
    if (slug && slug !== "www" && !slug.includes(".") && !pathname.startsWith("/_next") && !pathname.startsWith("/api/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/w/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2. Refresh
  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let refreshed: TokenPair | null = null;

  if (refresh && needsRefresh(access)) {
    refreshed = await rotate(refresh, request.headers.get("x-forwarded-for"));
    if (refreshed) {
      access = refreshed.accessToken;
      request.cookies.set(ACCESS_COOKIE, refreshed.accessToken);
      request.cookies.set(REFRESH_COOKIE, refreshed.refreshToken);
    } else {
      // Don't delete cookies here: a parallel request may have just rotated them (its Set-Cookie wins).
      // An invalid refresh token simply expires; the user is asked to sign in again.
      access = undefined;
    }
  }

  const signedIn = Boolean(access) && !needsRefresh(access, Date.now(), 0);

  // 3. Protection
  let response: NextResponse;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    response = NextResponse.redirect(login);
  } else if (AUTH_PAGES.includes(pathname) && signedIn) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = NextResponse.next({ request: { headers: request.headers } });
  }

  if (refreshed) writeSession(response.cookies, refreshed, SECURE);
  return response;
}

/**
 * Concurrent requests (page + prefetches) often carry the same refresh token. Share one rotation per token
 * for 30 s so they all get the same new pair instead of tripping the API's token-reuse detection.
 * (Per server process; across several instances the API's 30 s grace window prevents a forced logout.)
 */
const inflight = new Map<string, { at: number; result: Promise<TokenPair | null> }>();

function rotate(refreshToken: string, forwardedFor: string | null): Promise<TokenPair | null> {
  const now = Date.now();
  for (const [key, entry] of inflight) if (now - entry.at > 30_000) inflight.delete(key);
  const existing = inflight.get(refreshToken);
  if (existing) return existing.result;
  const result = callRefresh(refreshToken, forwardedFor);
  inflight.set(refreshToken, { at: now, result });
  return result;
}

async function callRefresh(refreshToken: string, forwardedFor: string | null): Promise<TokenPair | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as TokenPair) : null;
  } catch {
    return null;
  }
}

export const config = {
  // Skip static assets and the public, session-free routes (/w = public sites, /q = QR redirects).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|w/|q/|api/public/|robots.txt).*)"],
};

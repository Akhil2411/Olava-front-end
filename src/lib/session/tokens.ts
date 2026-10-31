/**
 * Session cookie names and helpers. Tokens are stored ONLY in HttpOnly cookies, so browser JavaScript
 * can never read them. This file has no server-only import so the proxy (Node runtime) can use it too.
 */
export const ACCESS_COOKIE = "olava_at";
export const REFRESH_COOKIE = "olava_rt";

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
}

export function cookieOptions(expiresAt: string, secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const, // sent on top-level navigations (WhatsApp links) but not on cross-site POSTs
    path: "/",
    expires: new Date(expiresAt),
  };
}

export function writeSession(store: CookieWriter, tokens: TokenPair, secure: boolean) {
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessTokenExpiresAt, secure));
  store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenExpiresAt, secure));
}

/**
 * Reads the `exp` claim WITHOUT verifying the signature. Used only to decide when to refresh;
 * the API always verifies the token itself.
 */
export function accessTokenExpiry(token: string | undefined): number | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when there is no usable access token (missing, unreadable, or expiring within `skewMs`). */
export function needsRefresh(token: string | undefined, now = Date.now(), skewMs = 60_000): boolean {
  const exp = accessTokenExpiry(token);
  return exp === null || exp - now < skewMs;
}

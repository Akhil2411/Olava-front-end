import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { googleAuthorizeUrl, newGoogleAttempt } from "@/features/auth/google";
import { encodeJsonCookie, isPendingVerification, readJsonCookie } from "@/features/auth/pending";
import { codeSchema } from "@/features/auth/schemas";

describe("one-time code input", () => {
  it("accepts digits, ignores spaces (a pasted '123 456'), refuses anything else", () => {
    expect(codeSchema.parse({ code: " 123 456 " }).code).toBe("123456");
    expect(codeSchema.safeParse({ code: "12a456" }).success).toBe(false);
    expect(codeSchema.safeParse({ code: "" }).success).toBe(false);
  });
});

describe("sign-in step cookies", () => {
  it("round-trip, and anything tampered or malformed is ignored", () => {
    const pending = { email: "asha@example.com", next: "/dashboard/new", resendAt: 1, sent: true };
    expect(readJsonCookie(encodeJsonCookie(pending))).toEqual(pending);
    expect(isPendingVerification(readJsonCookie(encodeJsonCookie(pending)))).toBe(true);
    expect(readJsonCookie("not base64 json")).toBeNull();
    expect(isPendingVerification({ email: "x" })).toBe(false);
  });
});

describe("Google sign-in request", () => {
  it("uses a fresh state and a PKCE S256 challenge derived from a 43–128 character verifier", () => {
    const a = newGoogleAttempt(), b = newGoogleAttempt();
    expect(a.state).not.toBe(b.state);
    expect(a.verifier.length).toBeGreaterThanOrEqual(43);
    expect(a.verifier.length).toBeLessThanOrEqual(128);
    expect(a.challenge).toBe(createHash("sha256").update(a.verifier).digest("base64url"));
  });

  it("sends the client id, exact redirect URI, scopes, state and challenge, never a secret", () => {
    const url = new URL(googleAuthorizeUrl({
      enabled: true, clientId: "abc.apps.googleusercontent.com", authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      redirectUri: "http://localhost:3000/api/auth/google/callback", scope: "openid email profile",
    }, "the-state", "the-challenge"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "abc.apps.googleusercontent.com", redirect_uri: "http://localhost:3000/api/auth/google/callback",
      response_type: "code", scope: "openid email profile", state: "the-state",
      code_challenge: "the-challenge", code_challenge_method: "S256", prompt: "select_account",
    });
  });
});

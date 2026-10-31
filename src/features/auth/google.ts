import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { api } from "@/lib/api/server";
import type { GoogleSignInConfig } from "@/lib/api/types";

/** Whether to show "Continue with Google" (cached for a minute; the API reports enabled = false until it's set up). */
export async function googleSignInConfig(): Promise<GoogleSignInConfig | null> {
  const result = await api<GoogleSignInConfig>("/api/v1/auth/google/config", { auth: false, revalidate: 60 });
  return result.ok && result.data.enabled && result.data.clientId && result.data.authorizationEndpoint ? result.data : null;
}

/** OAuth `state` (CSRF protection) and PKCE pair (RFC 7636, S256). */
export function newGoogleAttempt() {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url"); // 64 characters (43–128 allowed)
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, verifier, challenge };
}

export function googleAuthorizeUrl(config: GoogleSignInConfig, state: string, challenge: string): string {
  const url = new URL(config.authorizationEndpoint!);
  url.search = new URLSearchParams({
    client_id: config.clientId!,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

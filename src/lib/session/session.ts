import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import type { Me } from "@/lib/api/types";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./tokens";

/** The signed-in user as the API sees it (validated server-side on every call). One call per request. */
export const getCurrentUser = cache(async (): Promise<Me | null> => {
  const store = await cookies();
  if (!store.get(ACCESS_COOKIE)) return null;
  const me = await api<Me>("/api/v1/me");
  return me.ok ? me.data : null;
});

export async function requireUser(next?: string): Promise<Me> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** A requested "next" page, kept only when one was actually asked for (empty means "the user's home page"). */
export const requestedNext = (next: unknown): string => typeof next === "string" && next !== "" ? safeNext(next) : "";

/**
 * Where to go after signing in: the page they asked for, else their home page. Staff (Admin / Support) start
 * on the admin panel; everyone else on My weddings.
 */
export function landingFor(user: { platformRoles?: string[] }, next: unknown): string {
  if (typeof next === "string" && next !== "") return safeNext(next);
  return user.platformRoles?.some((r) => r === "PlatformAdmin" || r === "Support") ? "/admin" : "/dashboard";
}

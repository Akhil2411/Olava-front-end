"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api/server";
import type { ApiProblem } from "@/lib/api/problem";
import type { AuthResponse, RegisterResponse, ResendCodeResponse } from "@/lib/api/types";
import { env } from "@/lib/env";
import { fromProblem, fromZod, formValues, type FormState } from "@/lib/forms";
import { clearSession, landingFor, requestedNext } from "@/lib/session/session";
import { REFRESH_COOKIE, writeSession } from "@/lib/session/tokens";
import { VERIFY_COOKIE, encodeJsonCookie, isPendingVerification, pendingCookieOptions, readJsonCookie, type PendingVerification } from "./pending";
import { codeSchema, forgotSchema, loginSchema, registerSchema, resetSchema } from "./schemas";

/** Remembers who is verifying for 30 minutes and sends them to the code screen. */
async function startVerification(email: string, next: string, waitSeconds: number, sent: boolean): Promise<never> {
  const pending: PendingVerification = { email, next, resendAt: Date.now() + Math.max(0, waitSeconds) * 1000, sent };
  (await cookies()).set(VERIFY_COOKIE, encodeJsonCookie(pending), pendingCookieOptions(env.secureCookies, 30 * 60));
  redirect("/verify-email");
}

async function readPending(): Promise<PendingVerification | null> {
  const value = readJsonCookie<unknown>((await cookies()).get(VERIFY_COOKIE)?.value);
  return isPendingVerification(value) ? value : null;
}

function detail(problem: ApiProblem, key: string): unknown {
  return problem.details?.[key];
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, "password");
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);

  const result = await api<AuthResponse>("/api/v1/auth/login", { body: { email: parsed.data.email, password: parsed.data.password }, auth: false });
  if (!result.ok) {
    if (result.problem.code === "auth.email_not_verified") {
      // Right password, email not confirmed yet: the API has emailed a code (unless the cooldown is running).
      await startVerification(String(detail(result.problem, "email") ?? parsed.data.email), requestedNext(formData.get("next")),
        Number(detail(result.problem, "resendAvailableInSeconds") ?? 0), detail(result.problem, "codeSent") === true);
    }
    return fromProblem(result.problem, { email: parsed.data.email });
  }
  writeSession(await cookies(), result.data, env.secureCookies);
  redirect(landingFor(result.data.user, formData.get("next")));
}

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, "password", "confirmPassword");
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);

  const created = await api<RegisterResponse>("/api/v1/auth/register", {
    body: { email: parsed.data.email, password: parsed.data.password, fullName: parsed.data.fullName },
    auth: false,
  });
  if (!created.ok) return fromProblem(created.problem, values);
  if (created.data.emailVerificationRequired) {
    await startVerification(created.data.email, "/dashboard/new", created.data.resendAvailableInSeconds, created.data.codeSent);
  }

  const signedIn = await api<AuthResponse>("/api/v1/auth/login", { body: { email: parsed.data.email, password: parsed.data.password }, auth: false });
  if (!signedIn.ok) return fromProblem(signedIn.problem, { email: parsed.data.email });
  writeSession(await cookies(), signedIn.data, env.secureCookies);
  redirect("/dashboard/new");
}

export interface VerifyState extends FormState {
  /** The code can't be used any more (expired / too many tries): point at "send a new code". */
  needsNewCode?: boolean;
}

export async function verifyEmailAction(_: VerifyState, formData: FormData): Promise<VerifyState> {
  const pending = await readPending();
  if (!pending) return { status: "error", message: "This step timed out. Sign in again and we'll send you a new code." };
  const parsed = codeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return fromZod(parsed.error);

  const result = await api<AuthResponse>("/api/v1/auth/verify-email", { body: { email: pending.email, code: parsed.data.code }, auth: false });
  const store = await cookies();
  if (!result.ok) {
    if (result.problem.code === "auth.already_verified") {
      store.delete(VERIFY_COOKIE);
      redirect("/login?verified=1");
    }
    const needsNewCode = ["auth.code_expired", "auth.code_locked", "auth.code_missing"].includes(result.problem.code);
    return { ...fromProblem(result.problem), fieldErrors: needsNewCode ? undefined : { code: [result.problem.message] }, needsNewCode };
  }
  store.delete(VERIFY_COOKIE);
  writeSession(store, result.data, env.secureCookies);
  redirect(landingFor(result.data.user, pending.next));
}

export interface ResendState {
  status: "idle" | "sent" | "wait" | "error";
  /** Epoch ms when the next request is allowed. */
  resendAt?: number;
  message?: string;
}

export async function resendCodeAction(): Promise<ResendState> {
  const pending = await readPending();
  if (!pending) return { status: "error", message: "This step timed out. Sign in again and we'll send you a new code." };
  const result = await api<ResendCodeResponse>("/api/v1/auth/resend-code", { body: { email: pending.email }, auth: false });
  if (!result.ok) return { status: "error", message: result.problem.message };
  const resendAt = Date.now() + result.data.resendAvailableInSeconds * 1000;
  (await cookies()).set(VERIFY_COOKIE, encodeJsonCookie({ ...pending, resendAt, sent: result.data.codeSent } satisfies PendingVerification),
    pendingCookieOptions(env.secureCookies, 30 * 60));
  if (result.data.codeSent) return { status: "sent", resendAt, message: "We've sent a new code. Check your inbox (and spam folder)." };
  return result.data.resendAvailableInSeconds > 0
    ? { status: "wait", resendAt, message: "Please wait a little before asking for another code." }
    : { status: "error", resendAt, message: "We couldn't send the email just now. Please try again in a moment." };
}

export async function logoutAction(): Promise<void> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) await api("/api/v1/auth/logout", { body: { refreshToken }, auth: false });
  await clearSession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = forgotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error, values);
  const result = await api("/api/v1/auth/forgot-password", { body: { email: parsed.data.email }, auth: false });
  if (!result.ok && result.problem.status !== 400) return fromProblem(result.problem, values);
  // Same message whether or not the account exists (no account enumeration).
  return { status: "success", message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const result = await api("/api/v1/auth/reset-password", {
    body: { email: parsed.data.email, token: parsed.data.token, newPassword: parsed.data.password },
    auth: false,
  });
  if (!result.ok) return fromProblem(result.problem);
  redirect("/login?reset=1");
}

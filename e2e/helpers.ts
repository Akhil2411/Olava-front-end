import crypto from "node:crypto";
import type { Page } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:5033";
export const FAKE_RAZORPAY = process.env.E2E_FAKE_RAZORPAY ?? "http://localhost:5099";
export const WEBHOOK_SECRET = process.env.E2E_WEBHOOK_SECRET ?? "e2e_webhook_secret";
export const FAKE_RESEND = process.env.E2E_FAKE_RESEND ?? "http://localhost:5098";
export const FAKE_GOOGLE = process.env.E2E_FAKE_GOOGLE ?? "http://localhost:5097";

/** The latest one-time code the (fake) Resend received for this address. */
export async function latestCode(emailAddress: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const sent = (await (await fetch(`${FAKE_RESEND}/__test/emails?to=${encodeURIComponent(emailAddress)}`)).json()) as { text: string; subject: string }[];
    const match = sent.filter((e) => e.subject.includes("code")).at(-1)?.text.match(/code is: (\d+)/);
    if (match) return match[1];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no code emailed to ${emailAddress}`);
}

/** Chooses who "signs in" at the (fake) Google page next. */
export async function asGoogleUser(identity: { sub: string; email: string; name?: string; email_verified?: boolean; deny?: boolean }) {
  await fetch(`${FAKE_GOOGLE}/__test/identity`, { method: "POST", body: JSON.stringify({ email_verified: true, name: "Google Person", ...identity }) });
}

/** On the "Check your email" screen: enters the code that was emailed. */
export async function enterEmailedCode(page: Page, emailAddress: string) {
  await page.getByLabel("Verification code").fill(await latestCode(emailAddress));
  await page.getByRole("button", { name: "Confirm email" }).click();
}

export async function register(page: Page, name: string) {
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill("CorrectHorse-Battery9");
  await page.getByLabel("Confirm password").fill("CorrectHorse-Battery9");
  await page.getByRole("button", { name: "Create account" }).click();
  // With Auth:RequireEmailVerification on, the code screen comes first.
  await page.waitForURL(/\/(dashboard\/new|verify-email)$/);
  if (page.url().endsWith("/verify-email")) await enterEmailedCode(page, email);
  await page.waitForURL("**/dashboard/new");
  return email;
}

/** Simulates the customer completing payment at the (fake) provider, then the provider's signed webhook. */
export async function simulatePayment(status: "captured" | "failed") {
  const orders = (await (await fetch(`${FAKE_RAZORPAY}/__test/orders`)).json()) as { id: string }[];
  const order = orders.at(-1)!;
  const payment = await (await fetch(`${FAKE_RAZORPAY}/__test/pay`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: order.id, status }),
  })).json();
  const body = JSON.stringify({ entity: "event", event: status === "captured" ? "payment.captured" : "payment.failed", payload: { payment: { entity: payment } } });
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  const res = await fetch(`${API_URL}/api/v1/webhooks/razorpay`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Razorpay-Signature": signature, "X-Razorpay-Event-Id": `evt_${payment.id}` }, body,
  });
  if (!res.ok) throw new Error(`webhook failed: ${res.status} ${await res.text()}`);
  return payment;
}

/** Premium designs open with an animation (doors, envelope); taps the opening so the page can be used. */
export async function openInvite(page: Page) {
  const badge = page.locator("[data-olava-intro] button").first();
  if (await badge.count()) {
    // Keyboard: also proves the opening works without a mouse (the badge pulses, so it's never "stable" for a click).
    // A Classic opening (Heirloom's crest) also ends on its own, so its button may already be gone.
    await badge.press("Enter", { timeout: 5_000 }).catch(async (e) => { if (await badge.count()) throw e; });
    await page.locator("[data-olava-intro]").waitFor({ state: "detached", timeout: 10_000 });
  }
}

/**
 * After step 1 of "create your wedding" is filled in: picks `template` on the design step (if given), skips the
 * rest of the walkthrough (sections stay as the template sets them) and opens the wedding's Events page.
 * Returns the wedding's dashboard path.
 */
export async function skipSetupToEvents(page: Page, template?: string) {
  await page.getByRole("button", { name: "Next: choose your design" }).click();
  await page.waitForURL(/\/dashboard\/setup\/[0-9a-f-]+\?step=design/);
  const id = page.url().match(/setup\/([0-9a-f-]+)/)![1];
  if (template) {
    await page.locator(`[data-template-key="${template}"]`).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForURL(/step=sections/);
  }
  await page.getByRole("button", { name: "Skip this for now" }).click();
  await page.waitForURL(new RegExp(`/dashboard/weddings/${id}\\?setup=skipped`));
  await page.goto(`/dashboard/weddings/${id}/events`);
  return `/dashboard/weddings/${id}`;
}

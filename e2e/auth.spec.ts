import { expect, test } from "@playwright/test";
import { asGoogleUser, enterEmailedCode, FAKE_RESEND, latestCode, register, skipSetupToEvents } from "./helpers";

// Sign-in methods against the running stack. The API must run with Auth:RequireEmailVerification = true,
// Email:EmailSendingEnabled = true pointing at e2e/fake-resend.mjs, and Google pointing at e2e/fake-google.mjs
// (Readme01.md → "End-to-end tests"). Google and Resend are local stand-ins, not the real services.

const PASSWORD = "CorrectHorse-Battery9";
const newEmail = (p: string) => `${p}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;

async function emailsTo(address: string) {
  return (await (await fetch(`${FAKE_RESEND}/__test/emails?to=${encodeURIComponent(address)}`)).json()) as { subject: string; from: string }[];
}

test("email sign-up: a code is emailed, a wrong code is refused, the right one confirms and signs in", async ({ page }) => {
  const email = newEmail("otp");
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL("**/verify-email");
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByRole("button", { name: /Send a new code in \d+s/ })).toBeDisabled(); // cooldown
  const [sent] = await emailsTo(email);
  expect(sent.from).toContain("<");
  const code = await latestCode(email);

  await page.getByLabel("Verification code").fill(code === "000000" ? "111111" : "000000");
  await page.getByRole("button", { name: "Confirm email" }).click();
  await expect(page.getByText("That code isn't right. You have 4 tries left.")).toBeVisible();

  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Confirm email" }).click();
  await page.waitForURL("**/dashboard/new");

  // Signed in; and after signing out, the password works directly.
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**");
});

test("an unverified account that signs in is sent to the code screen first", async ({ page, browser }) => {
  const email = newEmail("later");
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Ravi Kumar");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/verify-email");

  // Comes back later in a fresh browser and signs in.
  const later = await (await browser.newContext()).newPage();
  await later.goto("/login");
  await later.getByLabel("Email").fill(email);
  await later.getByRole("textbox", { name: "Password", exact: true }).fill("wrong-password-123");
  await later.getByRole("button", { name: "Sign in" }).click();
  await expect(later.getByText("Email or password is incorrect.")).toBeVisible(); // wrong password: no hint, no code
  await later.getByRole("textbox", { name: "Password", exact: true }).fill(PASSWORD);
  await later.getByRole("button", { name: "Sign in" }).click();
  await later.waitForURL("**/verify-email");
  await enterEmailedCode(later, email);
  await later.waitForURL(/\/dashboard(\/new)?$/); // no wedding yet: the dashboard opens "create your wedding"
});

test("Google: a new person gets an account straight away; next time Google brings them back to it", async ({ page }) => {
  const email = newEmail("google");
  await asGoogleUser({ sub: `sub-${email}`, email, name: "Meera Iyer" });
  await page.goto("/register");
  await page.getByRole("link", { name: "Sign up with Google" }).click();
  await page.waitForURL("**/dashboard/new");
  expect(await emailsTo(email)).toEqual([]); // no code: Google already verified the address
  await expect(page.getByText("Meera Iyer").first()).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((u) => u.pathname === "/");
  await page.goto("/login");
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/dashboard(\/new)?$/); // still no wedding: straight back to "create your wedding"
});

test("Google with the email of an existing password account signs into that account (no duplicate)", async ({ page, context }) => {
  const email = await register(page, "Priya Nair");
  await page.getByLabel("Partner one").fill("Priya");
  await page.getByLabel("Partner two").fill("Arjun");
  await page.getByLabel("Wedding date").fill("2027-02-14");
  await skipSetupToEvents(page);
  await context.clearCookies();

  await asGoogleUser({ sub: `sub-${email}`, email, name: "Priya N" });
  await page.goto("/login");
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await page.waitForURL(/\/dashboard$/);
  await expect(page.getByText("Priya & Arjun").first()).toBeVisible(); // the same account's wedding
});

test("Google: cancelling, an unverified Google email and a forged callback all end on the sign-in page with a message", async ({ page }) => {
  await asGoogleUser({ sub: "sub-cancel", email: newEmail("cancel"), deny: true });
  await page.goto("/login");
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await expect(page.getByText("Google sign-in was cancelled.")).toBeVisible();

  await asGoogleUser({ sub: "sub-unverified", email: newEmail("unverified"), email_verified: false });
  await page.getByRole("link", { name: "Continue with Google" }).click();
  await expect(page.getByText(/email address isn't verified/)).toBeVisible();

  await page.goto("/api/auth/google/callback?code=forged&state=forged");
  await expect(page.getByText("We couldn't sign you in with Google. Please try again.")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?error=google$/);
});

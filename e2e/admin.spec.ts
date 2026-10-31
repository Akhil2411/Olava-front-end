import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { API_URL, register } from "./helpers";

const PAGES: [string, string][] = [
  ["/admin", "Overview"], ["/admin/users", "Users"], ["/admin/packages", "Packages"], ["/admin/orders", "Orders & payments"],
  ["/admin/templates", "Templates"], ["/admin/home", "Home page"], ["/admin/faqs", "FAQs"], ["/admin/sites", "Wedding sites"],
  ["/admin/media", "Media & storage"], ["/admin/activity", "Activity log"], ["/admin/settings", "Settings"],
];
const ENDPOINTS = ["me", "overview", "users", "tiers", "purchases", "templates", "designs", "home", "faqs", "site", "switches", "sites", "storage", "media", "orders", "activity"];

// ---- Non-staff can't reach anything (always runs).

test("signed-out visitors can't use the admin API or pages", async ({ page }) => {
  for (const e of ENDPOINTS) expect((await fetch(`${API_URL}/api/v1/admin/${e}`)).status, e).toBe(401);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("a customer gets 404 on every admin page and 403 from every admin endpoint", async ({ page }) => {
  await register(page, "Not Staff");
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  for (const [path] of PAGES) expect((await page.goto(path))?.status(), path).toBe(404);
  expect((await page.goto("/admin/users/00000000-0000-0000-0000-000000000000"))?.status()).toBe(404);
  // Same session, straight at the API (the web app's cookie holds the access token).
  const token = (await page.context().cookies()).find((c) => c.name === "olava_at")?.value;
  test.skip(!token, "access token cookie not found");
  for (const e of ENDPOINTS) {
    const r = await fetch(`${API_URL}/api/v1/admin/${e}`, { headers: { authorization: `Bearer ${token}` } });
    expect(r.status, e).toBe(403);
  }
  const write = await fetch(`${API_URL}/api/v1/admin/faqs`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ question: "x", answer: "y", isPublished: true }),
  });
  expect(write.status).toBe(403);
});

// ---- Admin pages. Needs an admin account: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (made admin with Admin:BootstrapEmails).

const ADMIN = process.env.E2E_ADMIN_EMAIL, ADMIN_PW = process.env.E2E_ADMIN_PASSWORD;

async function signInAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN!);
  await page.getByRole("textbox", { name: "Password", exact: true }).fill(ADMIN_PW!);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Staff start on the admin panel, not on the couples' walkthrough.
  await page.waitForURL((u) => u.pathname === "/admin");
}

test.describe("admin pages", () => {
  test.skip(!ADMIN || !ADMIN_PW, "set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run");

  test("each page highlights its menu item and passes WCAG A/AA checks", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signInAdmin(page);
    for (const [path, label] of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "Admin", exact: true }).locator('[aria-current="page"]')).toHaveAccessibleName(label);
      await expect(page.getByRole("navigation", { name: "Account" }).locator('[aria-current="page"]')).toHaveText("Admin");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${path} ${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
    }
  });

  test("staff have no My weddings: the dashboard sends them to the admin panel", async ({ page }) => {
    await signInAdmin(page);
    await expect(page.getByRole("link", { name: "My weddings" })).toHaveCount(0);
    for (const path of ["/dashboard", "/dashboard/new"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin$/);
    }
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: "Admin" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "My weddings" })).toHaveCount(0);
  });

  test("a user's page keeps Users highlighted", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/admin/users");
    await page.locator('a[href^="/admin/users/"]').first().click();
    await page.waitForURL(/\/admin\/users\/.+/);
    await expect(page.getByRole("navigation", { name: "Admin", exact: true }).locator('[aria-current="page"]')).toHaveAccessibleName("Users");
  });

  test("phones: no sideways scroll and the section is marked", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await signInAdmin(page);
    for (const [path, label] of PAGES) {
      await page.goto(path);
      await expect(page.getByRole("navigation", { name: "Admin sections" }).locator('[aria-current="page"]')).toHaveAccessibleName(label);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(360);
    }
  });
});

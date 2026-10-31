import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end journey against a RUNNING stack (see Readme01.md → "End-to-end tests"):
 *   API on E2E_API_URL (default http://localhost:5033) and the web app on E2E_BASE_URL (default http://localhost:3000).
 * Payments: when E2E_FAKE_RAZORPAY is set, the API must be configured to call that local test double instead of
 * Razorpay, and the test simulates the customer's payment through signed webhooks. That is NOT a live sandbox run.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

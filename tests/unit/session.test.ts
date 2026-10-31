import { describe, expect, it } from "vitest";
import { accessTokenExpiry, needsRefresh } from "@/lib/session/tokens";
import { safeNext } from "@/lib/session/session";

const jwt = (exp: number) => `x.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.y`;

describe("session tokens", () => {
  it("reads exp without trusting the token", () => {
    expect(accessTokenExpiry(jwt(2_000_000_000))).toBe(2_000_000_000_000);
    expect(accessTokenExpiry("garbage")).toBeNull();
    expect(accessTokenExpiry(undefined)).toBeNull();
  });

  it("refreshes when missing or expiring within a minute", () => {
    const now = 1_000_000_000_000;
    expect(needsRefresh(undefined, now)).toBe(true);
    expect(needsRefresh(jwt(now / 1000 + 30), now)).toBe(true);
    expect(needsRefresh(jwt(now / 1000 + 600), now)).toBe(false);
  });
});

describe("safeNext (open-redirect protection)", () => {
  it.each([["/dashboard/x", "/dashboard/x"], ["https://evil.com", "/dashboard"], ["//evil.com", "/dashboard"], ["/\\evil.com", "/dashboard"], [null, "/dashboard"]])(
    "%s → %s", (input, expected) => expect(safeNext(input)).toBe(expected));
});

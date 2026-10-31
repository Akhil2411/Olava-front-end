import { describe, expect, it } from "vitest";
import { toProblem } from "@/lib/api/problem";

describe("toProblem", () => {
  it("keeps the API's stable code and detail", () => {
    const p = toProblem(409, { code: "publish.payment_required", detail: "Publishing needs a purchase.", blockers: ["payment_required"] });
    expect(p).toMatchObject({ status: 409, code: "publish.payment_required", message: "Publishing needs a purchase." });
    expect(p.details).toEqual({ blockers: ["payment_required"] });
  });

  it("normalises ASP.NET validation errors to camelCase fields", () => {
    const p = toProblem(400, { title: "One or more validation errors occurred.", errors: { PartnerOneName: ["Required"], "$.email": ["Bad"] } });
    expect(p.code).toBe("validation");
    expect(p.fieldErrors).toEqual({ partnerOneName: ["Required"], email: ["Bad"] });
  });

  it("keeps CSV row errors (rowErrors) in details", () => {
    const p = toProblem(400, { code: "guests.import_invalid", detail: "x", rowErrors: [{ row: 2, column: "email", message: "bad" }] });
    expect(p.details?.rowErrors).toHaveLength(1);
  });

  it("never exposes internal server details", () => {
    const p = toProblem(500, { title: "System.NullReferenceException at ...", traceId: "abc" });
    expect(p.code).toBe("server.error");
    expect(p.message).not.toContain("NullReference");
  });

  it("maps auth and rate-limit statuses", () => {
    expect(toProblem(401, null).code).toBe("auth.unauthorized");
    expect(toProblem(429, null).code).toBe("rate_limited");
  });
});

import { describe, expect, it } from "vitest";
import { formatDate, formatLocalDateTime, formatMoney } from "@/lib/utils/format";

describe("format", () => {
  it("formats paise as rupees", () => {
    expect(formatMoney(69900)).toBe("₹699");
    expect(formatMoney(119900)).toBe("₹1,199");
    expect(formatMoney(50050)).toBe("₹500.50");
  });
  it("formats wall-clock event times without shifting time zones", () => {
    const { date, time } = formatLocalDateTime("2027-02-14T16:30");
    expect(date).toMatch(/14 Feb,? 2027/);
    expect(time.toLowerCase()).toContain("4:30");
  });
  it("formats date-only values", () => {
    expect(formatDate("2027-02-14")).toBe("14 February 2027");
  });
});

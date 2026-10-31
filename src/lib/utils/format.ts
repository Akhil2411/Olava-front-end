/** Display helpers. Money is always in minor units (paise) from the API; never computed client-side. */
export function formatMoney(minor: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 })
    .format(minor / 100);
}

/** "2027-02-14" → "14 February 2027" (date-only values have no time zone). */
export function formatDate(date: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  if (!date) return "";
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { ...options, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2027-02-14T16:30" (wall-clock in the wedding's time zone) → "Sun, 14 Feb · 4:30 pm". */
export function formatLocalDateTime(local: string): { date: string; time: string } {
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hh, mm));
  return {
    date: new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(utc),
    time: new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(utc),
  };
}

export function formatInstant(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/**
 * A field label for use mid-sentence ("Show …", "Add …"): lowercases the first letter, except when the label
 * starts with a name ("Meera's family line"), a possessive, or an acronym ("RSVP button").
 */
export function midSentence(label: string): string {
  const first = label.split(/\s/)[0] ?? "";
  if (/['’]s$/.test(first) || /^[A-Z0-9]{2,}/.test(first)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

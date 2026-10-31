/** Time zones offered in the editor (launch market first). The API validates any IANA id. */
export const TIME_ZONES = [
  ["Asia/Kolkata", "India (IST)"],
  ["Asia/Dubai", "UAE (GST)"],
  ["Asia/Singapore", "Singapore"],
  ["Europe/London", "United Kingdom"],
  ["America/New_York", "US Eastern"],
  ["America/Los_Angeles", "US Pacific"],
  ["Australia/Sydney", "Australia (Sydney)"],
] as const;

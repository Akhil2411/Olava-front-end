/**
 * Event types offered in the event forms, for Kerala and wider Indian weddings (owner decision 2026-10-26).
 * Stored as the label itself (the API accepts any text up to 64 characters), so an older value such as
 * "Ceremony" stays valid and is still offered when editing that event.
 */
export const EVENT_TYPES = [
  "Engagement (Nischayam)", "Betrothal (Manasammatham)", "Madhuramvekkal", "Mehendi / Mylanchi", "Haldi", "Sangeet",
  "Wedding", "Nikah", "Reception", "Walima", "Cocktail night", "Other",
] as const;

/** One-tap suggestions in the walkthrough: the event's name and its type. */
export const EVENT_SUGGESTIONS: { name: string; type: (typeof EVENT_TYPES)[number] }[] = [
  { name: "Engagement", type: "Engagement (Nischayam)" },
  { name: "Madhuramvekkal", type: "Madhuramvekkal" },
  { name: "Mehendi", type: "Mehendi / Mylanchi" },
  { name: "Haldi", type: "Haldi" },
  { name: "Sangeet", type: "Sangeet" },
  { name: "Wedding", type: "Wedding" },
  { name: "Nikah", type: "Nikah" },
  { name: "Reception", type: "Reception" },
];

/** The options for a type select: the list, plus an existing value that isn't in it (kept, not lost). */
export function eventTypeOptions(current: string | null | undefined): string[] {
  const list: string[] = [...EVENT_TYPES];
  return current && !list.includes(current) ? [current, ...list] : list;
}

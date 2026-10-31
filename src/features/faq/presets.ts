/**
 * Questions guests commonly ask (Kerala / Indian weddings). Tapping one adds it with an empty answer; the sample
 * answer is only a placeholder hint for the couple, never saved or shown to guests.
 */
export const FAQ_PRESETS: readonly { question: string; sample: string }[] = [
  { question: "Is there a dress code?", sample: "e.g. Traditional wear. Kerala sarees and mundu for the wedding, festive colours for the reception." },
  { question: "Is there parking at the venue?", sample: "e.g. Yes, free parking is available at the venue. Volunteers will guide you." },
  { question: "Can I bring a plus-one or children?", sample: "e.g. Children are very welcome. Please include everyone in your RSVP." },
  { question: "Will the food be vegetarian or non-vegetarian?", sample: "e.g. A traditional vegetarian sadya at the wedding, and both at the reception." },
  { question: "When should I RSVP by?", sample: "e.g. Please reply by 15 December so we can plan the food." },
  { question: "What time should I arrive?", sample: "e.g. The muhurtham is at 10:30 am. Please arrive by 10:00 am." },
  { question: "How do I get to the venue?", sample: "e.g. The venue is 20 minutes from the railway station. Use the map link above." },
  { question: "Where can out-of-town guests stay?", sample: "e.g. We've booked rooms at a nearby hotel. Call us and we'll arrange one." },
  { question: "Can I take photos during the ceremony?", sample: "e.g. Please enjoy the ceremony; our photographers will share everything later." },
  { question: "Is there a gift registry?", sample: "e.g. Your blessings are the best gift. If you'd like to give something, see our registry." },
  { question: "Is the venue accessible for elderly guests?", sample: "e.g. Yes, there is a ramp and seating close to the stage." },
  { question: "Who can I contact on the day?", sample: "e.g. Call Arun on +91 … for anything on the day." },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** The sample answer for a preset question (matched loosely), else a generic hint. */
export function faqSample(question: string): string {
  return FAQ_PRESETS.find((p) => norm(p.question) === norm(question))?.sample ?? "Type your answer";
}

/** Presets not already in the list. */
export function unusedPresets(questions: string[]) {
  const have = new Set(questions.map(norm));
  return FAQ_PRESETS.filter((p) => !have.has(norm(p.question)));
}

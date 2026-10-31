import type { SectionType, WeddingSetup } from "@/lib/api/types";

/** The sections offered in the walkthrough (same list and order as the API's WeddingSetup.Offered). */
export const OFFERED: { type: SectionType; label: string; description: string; preselected?: boolean; required?: boolean; form: boolean }[] = [
  { type: "story", label: "Our story", description: "How you met, in your own words.", preselected: true, form: true },
  { type: "events", label: "Events", description: "Your celebrations with times and places.", preselected: true, required: true, form: true },
  { type: "countdown", label: "Countdown", description: "Days to go until the big day.", preselected: true, form: false },
  { type: "gallery", label: "Gallery", description: "Your favourite photos.", preselected: true, form: true },
  { type: "rsvp", label: "RSVP", description: "Guests reply online.", preselected: true, form: true },
  { type: "welcome", label: "Welcome note", description: "A short letter to your guests.", form: true },
  { type: "dress_code", label: "Dress code", description: "What to wear, with colour ideas.", form: true },
  { type: "wedding_party", label: "Wedding party", description: "Introduce your family and friends.", form: true },
  { type: "video", label: "Video", description: "Upload a video (MP4 or WebM, up to 30 MB).", form: true },
  { type: "travel", label: "Travel & stay", description: "Getting there and where to stay.", form: true },
  { type: "faq", label: "FAQ", description: "Answers to guests' questions.", form: true },
  { type: "venue", label: "Venue", description: "Your venues with an Open in Maps link (from your events).", form: false },
  { type: "registry", label: "Gift registry", description: "Links to your registry or gift ideas.", form: true },
  { type: "explore", label: "Things to do", description: "Ideas for guests making a trip of it.", form: true },
  { type: "contact", label: "Contact", description: "How guests can reach you.", form: false },
  { type: "save_the_date", label: "Save the date", description: "Your date as a card guests can save.", form: false },
];

export const DEFAULT_SELECTION = OFFERED.filter((o) => o.preselected).map((o) => o.type);

/** Every step in order: the two of you, choose a design, choose sections, one form per chosen section that has one, done. */
export function stepsFor(selected: readonly string[]): string[] {
  return ["couple", "design", "sections", ...OFFERED.filter((o) => o.form && selected.includes(o.type)).map((o) => o.type), "done"];
}

export const labelOf = (step: string) =>
  step === "couple" ? "The two of you" : step === "design" ? "Choose your design" : step === "sections" ? "Choose your sections" : step === "done" ? "All set" : OFFERED.find((o) => o.type === step)?.label ?? step;

/** "Step 3 of 7" for where the walkthrough would resume. */
export function progressOf(setup: Pick<WeddingSetup, "step" | "sections">) {
  const steps = stepsFor(setup.sections.length ? setup.sections : DEFAULT_SELECTION);
  const index = Math.max(1, steps.indexOf(setup.step ?? "design"));
  return { index: index + 1, total: steps.length };
}

/** Whether the "Finish setting up" card should show for this wedding. */
export const isOpenSetup = (setup: WeddingSetup | null | undefined) => setup?.status === "in_progress" || setup?.status === "skipped";

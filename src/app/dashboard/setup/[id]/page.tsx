import type { Metadata } from "next";
import { getTemplates } from "@/features/catalog/data";
import { SetupWizard } from "@/features/setup/components/SetupWizard";
import { DEFAULT_SELECTION, stepsFor } from "@/features/setup/steps";
import { getEvents, getMedia, getSections, getVenues, getWedding } from "@/features/weddings/data";
import type { WeddingSetup } from "@/lib/api/types";

export const metadata: Metadata = { title: "Set up your website", robots: { index: false } };

/** The first-run walkthrough. Resumes where it was left (the step is saved with the wedding). */
export default async function SetupPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const [wedding, sections, events, venues, media, templates] = await Promise.all([
    getWedding(id), getSections(id), getEvents(id), getVenues(id), getMedia(id), getTemplates(),
  ]);
  const setup: WeddingSetup = wedding.setup ?? { status: "in_progress", step: "design", sections: [] };
  const steps = stepsFor(setup.sections.length ? setup.sections : DEFAULT_SELECTION);
  const asked = typeof sp.step === "string" ? sp.step : setup.step ?? "design";
  const step = steps.includes(asked) ? asked : "design";
  return (
    <SetupWizard wedding={wedding} setup={setup} step={step} sections={sections} events={events} venues={venues} templates={templates}
      images={media.filter((m) => m.purpose !== "Music" && m.purpose !== "Video")} videos={media.filter((m) => m.purpose === "Video")}
      gallery={media.filter((m) => m.purpose === "Gallery").sort((a, b) => a.sortOrder - b.sortOrder)} galleryLimit={100} />
  );
}

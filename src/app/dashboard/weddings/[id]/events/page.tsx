import { Alert } from "@/components/ui";
import { EventsEditor } from "@/features/events/components/EventsEditor";
import { coverChoices } from "@/features/events/covers";
import { getEvents, getMedia, getVenues, getWedding } from "@/features/weddings/data";

export default async function EventsPage({ params, searchParams }: PageProps<"/dashboard/weddings/[id]/events">) {
  const { id } = await params;
  const sp = await searchParams;
  const [wedding, events, venues, covers] = await Promise.all([getWedding(id), getEvents(id), getVenues(id), getMedia(id)]);
  return (
    <>
      {sp.welcome ? (
        <Alert tone="success" className="mb-6" title="Your draft is ready">
          Step 2 of 3: add your events. Then preview your website from the top of the page.
        </Alert>
      ) : null}
      <EventsEditor weddingId={id} events={events} venues={venues} covers={coverChoices(covers)} readOnly={wedding.status === "Archived"} />
    </>
  );
}

import Link from "next/link";
import { Alert, Card, CardHeader } from "@/components/ui";
import { GuestList } from "@/features/guests/components/GuestList";
import { getGuestSummary, getGuests, getSections, getWedding } from "@/features/weddings/data";

export default async function GuestsPage({ params, searchParams }: PageProps<"/dashboard/weddings/[id]/guests">) {
  const { id } = await params;
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const [wedding, summary, page, sections] = await Promise.all([
    getWedding(id), getGuestSummary(id),
    getGuests(id, { q: str(sp.q), status: str(sp.status), page: Number(str(sp.page)) || 1 }),
    getSections(id),
  ]);
  const rsvp = sections.find((s) => s.type === "rsvp");

  const stats: [string, number, string?][] = [
    ["Guests", summary.totalGuests], ["Attending", summary.attending, `${summary.attendingHeadcount} incl. plus-ones`],
    ["Not attending", summary.notAttending], ["Maybe", summary.undecided], ["No response", summary.pending],
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4 text-center">
            <dt className="text-xs text-mute">{label}</dt>
            <dd className="font-serif text-4xl text-pink-dark">{value}</dd>
            {sub ? <dd className="text-xs text-mute">{sub}</dd> : null}
          </div>
        ))}
      </dl>
      {!rsvp?.isEnabled ? (
        <Alert tone="warning" action={<Link className="font-semibold underline" href={`/dashboard/weddings/${id}/design`}>Turn it on</Link>}>
          The RSVP section is hidden, so guests can&apos;t reply on your website.
        </Alert>
      ) : null}
      <Card>
        <CardHeader title="Guests & RSVPs" description="Your guest list is private. Guests never see each other's details." />
        <GuestList weddingId={id} page={page} readOnly={wedding.status === "Archived"} />
      </Card>
    </div>
  );
}

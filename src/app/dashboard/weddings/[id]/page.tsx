import Link from "next/link";
import { Card, CardHeader, LinkButton } from "@/components/ui";
import { SetupResumeCard } from "@/features/setup/components/SetupResumeCard";
import { isOpenSetup } from "@/features/setup/steps";
import { getEvents, getGuestSummary, getMedia, getPublishing, getSections, getWedding } from "@/features/weddings/data";
import { formatDate } from "@/lib/utils/format";

export default async function WeddingOverviewPage({ params }: PageProps<"/dashboard/weddings/[id]">) {
  const { id } = await params;
  const [wedding, events, sections, media, summary, publishing] = await Promise.all([
    getWedding(id), getEvents(id), getSections(id), getMedia(id, "Gallery"), getGuestSummary(id), getPublishing(id),
  ]);
  const base = `/dashboard/weddings/${id}`;
  const rsvpOn = sections.some((s) => s.type === "rsvp" && s.isEnabled);

  const steps = [
    { done: Boolean(wedding.weddingDate), label: "Add your wedding date and details", href: `${base}/details` },
    { done: Boolean(wedding.template), label: "Choose a template", href: `${base}/design` },
    { done: events.some((e) => e.isVisible), label: "Add at least one event", href: `${base}/events` },
    { done: media.length > 0, label: "Upload gallery photos (optional)", href: `${base}/gallery` },
    { done: rsvpOn, label: "Turn on RSVP and add guests", href: `${base}/guests` },
    { done: Boolean(publishing.entitlement), label: "Choose your package", href: `${base}/publish` },
    { done: wedding.status === "Published", label: "Publish and share your website", href: `${base}/publish` },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
    {isOpenSetup(wedding.setup) ? <SetupResumeCard weddingId={id} setup={wedding.setup!} /> : null}
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader title="Getting ready" description={`${doneCount} of ${steps.length} steps done. Everything except publishing is free.`} />
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-tint" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount} aria-label="Setup progress">
          <div className="h-full rounded-full bg-pink-dark" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-blush">
                <span aria-hidden="true" className={s.done ? "grid h-6 w-6 place-items-center rounded-full bg-success text-xs text-white" : "h-6 w-6 rounded-full border-2 border-line"}>{s.done ? "✓" : ""}</span>
                <span className={s.done ? "text-mute line-through decoration-mute/40" : "font-medium"}>{s.label}</span>
                <span className="sr-only">{s.done ? "(done)" : "(to do)"}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="RSVPs" action={<LinkButton href={`${base}/guests`} variant="ghost" size="sm">Manage →</LinkButton>} />
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[["Attending", summary.attendingHeadcount], ["Declined", summary.notAttending], ["Pending", summary.pending]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-blush p-3">
                <dt className="text-xs text-mute">{label}</dt>
                <dd className="font-serif text-4xl text-pink-dark">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-mute">{summary.totalGuests} guests on your list · attending count includes plus-ones</p>
        </Card>
        <Card>
          <CardHeader title="Your website" />
          {publishing.publicUrl ? (
            <div className="space-y-3 text-sm">
              <p>Live at <a className="break-all font-semibold text-pink-dark underline" href={publishing.publicUrl} target="_blank" rel="noopener noreferrer">{publishing.publicUrl}</a></p>
              {publishing.entitlement ? <p className="text-mute">Online until {formatDate(publishing.entitlement.liveUntil)}</p> : null}
              <LinkButton href={`${base}/publish`} size="sm">Share</LinkButton>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-mute">
              <p>Your website is a private draft. Only you can see it.</p>
              <LinkButton href={`${base}/preview`} variant="secondary" size="sm">Preview</LinkButton>
            </div>
          )}
        </Card>
      </div>
    </div>
    </div>
  );
}

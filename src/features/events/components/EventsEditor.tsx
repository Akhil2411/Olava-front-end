"use client";

import { useState, useTransition } from "react";
import { Alert, Badge, Button, Card, CardHeader, ConfirmDialog, EmptyState } from "@/components/ui";
import type { ApiProblem } from "@/lib/api/problem";
import type { Media, Venue, WeddingEvent } from "@/lib/api/types";
import { formatLocalDateTime } from "@/lib/utils/format";
import { deleteEventAction, deleteVenueAction, reorderEventsAction } from "../actions";
import { EventDialog, VenueDialog } from "./EventForm";

export function EventsEditor({ weddingId, events, venues, covers, readOnly }: {
  weddingId: string; events: WeddingEvent[]; venues: Venue[]; covers: Media[]; readOnly: boolean;
}) {
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | "new" | null>(null);
  const [editingVenue, setEditingVenue] = useState<Venue | "new" | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "event" | "venue"; id: string; name: string } | null>(null);
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [pending, start] = useTransition();
  const venueName = (id: string | null) => venues.find((v) => v.id === id)?.name;

  const move = (index: number, delta: number) => start(async () => {
    const ids = events.map((e) => e.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    const result = await reorderEventsAction(weddingId, ids);
    setProblem(result.ok ? null : result.error);
  });

  const confirmDelete = () => start(async () => {
    if (!deleting) return;
    const result = deleting.kind === "event"
      ? await deleteEventAction(weddingId, deleting.id)
      : await deleteVenueAction(weddingId, deleting.id);
    setProblem(result.ok ? null : result.error);
    setDeleting(null);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader title="Events & functions" description="Engagement, mehendi, ceremony, reception… shown in this order on your website."
          action={!readOnly ? <Button size="sm" onClick={() => setEditingEvent("new")}>+ Add event</Button> : null} />
        {problem && !editingEvent && !editingVenue ? <Alert tone="error" className="mb-4">{problem.message}</Alert> : null}
        {events.length === 0 ? (
          <EmptyState icon="📅" title="No events yet" action={!readOnly ? <Button onClick={() => setEditingEvent("new")}>Add your first event</Button> : null}>
            Add at least one event to publish. Each event can have its own venue, time and dress code.
          </EmptyState>
        ) : (
          <ol className="space-y-3">
            {events.map((e, i) => {
              const start = formatLocalDateTime(e.startsAtLocal);
              return (
                <li key={e.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl">{e.name}</h3>
                        {e.eventType ? <Badge>{e.eventType}</Badge> : null}
                        {!e.isVisible ? <Badge tone="neutral">Hidden</Badge> : null}
                        {!venueName(e.venueId) ? <Badge tone="warning">No venue</Badge> : null}
                      </div>
                      <p className="text-sm text-mute">{start.date} · {start.time}{venueName(e.venueId) ? ` · ${venueName(e.venueId)}` : ""}</p>
                      {e.dressCode ? <p className="text-sm">Dress code: {e.dressCode}</p> : null}
                    </div>
                    {!readOnly ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" aria-label={`Move ${e.name} up`} disabled={i === 0 || pending} onClick={() => move(i, -1)}>↑</Button>
                        <Button variant="ghost" size="sm" aria-label={`Move ${e.name} down`} disabled={i === events.length - 1 || pending} onClick={() => move(i, 1)}>↓</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingEvent(e)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting({ kind: "event", id: e.id, name: e.name })}>Delete</Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card>
        <CardHeader title="Venues" description="Reuse a venue across events. Add a map link or an address for directions."
          action={!readOnly ? <Button size="sm" variant="secondary" onClick={() => setEditingVenue("new")}>+ Add venue</Button> : null} />
        {venues.length === 0 ? <p className="text-sm text-mute">No venues yet.</p> : (
          <ul className="space-y-3">
            {venues.map((v) => (
              <li key={v.id} className="rounded-2xl bg-blush p-4">
                <p className="font-semibold">{v.name}</p>
                <p className="text-sm text-mute">{[v.addressLine, v.city, v.state, v.postalCode].filter(Boolean).join(", ") || "No address"}</p>
                {!readOnly ? (
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingVenue(v)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting({ kind: "venue", id: v.id, name: v.name })}>Delete</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EventDialog key={editingEvent === "new" ? "new" : editingEvent?.id ?? "none"} weddingId={weddingId} event={editingEvent}
        events={events} venues={venues} covers={covers} onClose={() => setEditingEvent(null)} />
      <VenueDialog key={editingVenue === "new" ? "new-venue" : editingVenue?.id ?? "no-venue"} weddingId={weddingId} venue={editingVenue} onClose={() => setEditingVenue(null)} />
      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} onConfirm={confirmDelete} busy={pending}
        title={`Delete ${deleting?.kind === "venue" ? "venue" : "event"}?`} confirmLabel="Delete">
        <p>“{deleting?.name}” will be removed from your draft.{deleting?.kind === "venue" ? " Events at this venue will keep their details but have no venue." : ""}</p>
      </ConfirmDialog>
    </div>
  );
}

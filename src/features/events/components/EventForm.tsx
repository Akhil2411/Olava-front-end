"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert, Button, Checkbox, HelpTip, Modal, SelectField, TextArea, TextField } from "@/components/ui";
import type { ApiProblem } from "@/lib/api/problem";
import type { Media, Venue, WeddingEvent } from "@/lib/api/types";
import { saveEventAction, saveVenueAction, type EventInput, type VenueInput } from "../actions";
import { eventTypeOptions } from "../types";
import { CoverField } from "./CoverField";

export { EVENT_TYPES } from "../types";

const errorsFor = (problem: ApiProblem | null, field: string) => problem?.fieldErrors?.[field];

/**
 * The venue a NEW event starts with: the only venue, or the one the latest event uses. Most weddings reuse a
 * venue, so this saves the step people most often forget. (Edited events keep their own choice.)
 */
export function defaultVenueId(events: WeddingEvent[], venues: Venue[]): string {
  if (venues.length === 1) return venues[0].id;
  const latest = [...events].reverse().find((e) => e.venueId && venues.some((v) => v.id === e.venueId));
  return latest?.venueId ?? "";
}

/**
 * Add/edit an event. Saving with "No venue" asks first (the event would show without a location); a venue
 * created from here is selected automatically. Used in the Events tab (in a dialog) and in the setup walkthrough.
 */
export function EventFormBody({ weddingId, existing, venues: initialVenues, covers, initialVenueId, onSaved, onCancel, submitLabel, cancelLabel = "Cancel" }: {
  weddingId: string; existing: WeddingEvent | null; venues: Venue[]; covers: Media[]; initialVenueId: string;
  onSaved: (event: WeddingEvent) => void; onCancel?: () => void; submitLabel?: string; cancelLabel?: string;
}) {
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [pending, start] = useTransition();
  const [venues, setVenues] = useState(initialVenues);
  const [venueId, setVenueId] = useState(existing ? existing.venueId ?? "" : initialVenueId);
  const [addingVenue, setAddingVenue] = useState(false);
  const [coverId, setCoverId] = useState<string | null>(existing?.coverMediaId ?? null);
  const [confirm, setConfirm] = useState<EventInput | null>(null);
  // Venues saved elsewhere (another tab, the Venues card) also appear here.
  const allVenues = [...venues, ...initialVenues.filter((v) => !venues.some((x) => x.id === v.id))];

  const save = (input: EventInput) => start(async () => {
    const result = await saveEventAction(weddingId, existing?.id ?? null, input);
    if (result.ok) { setProblem(null); setConfirm(null); onSaved(result.data); } else { setConfirm(null); setProblem(result.error); }
  });

  // onSubmit (not a form action): React resets a form after its action runs, which would empty the fields when
  // the "No venue" question or an error sends the person back to the form.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const input: EventInput = {
      name: String(formData.get("name") ?? ""),
      eventType: String(formData.get("eventType") ?? ""),
      startsAtLocal: String(formData.get("startsAtLocal") ?? ""),
      endsAtLocal: String(formData.get("endsAtLocal") ?? ""),
      venueId: venueId || null,
      coverMediaId: coverId,
      dressCode: String(formData.get("dressCode") ?? ""),
      description: String(formData.get("description") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      isVisible: formData.get("isVisible") === "on",
    };
    if (!input.name.trim() || !input.startsAtLocal) {
      setProblem({ status: 400, code: "client.invalid", message: "Please check the highlighted fields.",
        fieldErrors: { ...(input.name.trim() ? {} : { name: ["Enter a name."] }), ...(input.startsAtLocal ? {} : { startsAtLocal: ["Choose a start date and time."] }) } });
      return;
    }
    if (!input.venueId) { setConfirm(input); return; } // ask first; never blocks saving
    save(input);
  };

  return (
    <>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {problem ? <Alert tone="error">{problem.message}</Alert> : null}
        <TextField label="Event name" name="name" required defaultValue={existing?.name} placeholder="e.g. Wedding" errors={errorsFor(problem, "name")} />
        <SelectField label="Type" name="eventType" defaultValue={existing?.eventType ?? ""}>
          <option value="">None</option>
          {eventTypeOptions(existing?.eventType).map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Starts" name="startsAtLocal" type="datetime-local" required defaultValue={existing?.startsAtLocal} errors={errorsFor(problem, "startsAtLocal")} />
          <TextField label="Ends (optional)" name="endsAtLocal" type="datetime-local" defaultValue={existing?.endsAtLocal ?? ""} errors={errorsFor(problem, "endsAtLocal")} />
        </div>
        <div className="flex items-end gap-2">
          <SelectField label="Venue" name="venueId" value={venueId} onChange={(e) => setVenueId(e.target.value)} wrapperClassName="flex-1">
            <option value="">No venue</option>
            {allVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </SelectField>
          <Button type="button" variant="secondary" size="sm" className="h-12 shrink-0" onClick={() => setAddingVenue(true)}>+ New venue</Button>
        </div>
        <CoverField weddingId={weddingId} photos={covers} value={coverId} onChange={setCoverId} />
        <TextField label="Dress code" name="dressCode" defaultValue={existing?.dressCode ?? ""} placeholder="Pastels, traditional wear…" />
        <TextArea label="Description" name="description" defaultValue={existing?.description ?? ""} maxLength={2000} />
        <TextArea label="Notes for guests" name="notes" defaultValue={existing?.notes ?? ""} maxLength={2000} hint="Parking, timings, anything guests should know." />
        <Checkbox label="Show this event on the website" name="isVisible" defaultChecked={existing?.isVisible ?? true} />
        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>{cancelLabel}</Button> : null}
          <Button type="submit" loading={pending}>{submitLabel ?? (existing ? "Save event" : "Add event")}</Button>
        </div>
      </form>

      <VenueDialog weddingId={weddingId} venue={addingVenue ? "new" : null} onClose={() => setAddingVenue(false)}
        onSaved={(v) => { setVenues((list) => [...list.filter((x) => x.id !== v.id), v]); setVenueId(v.id); setAddingVenue(false); }} />

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title="No venue selected">
        <div className="space-y-3 text-sm text-mute">
          <p>This event will appear on your website without a location. Do you want to continue anyway?</p>
          {allVenues.length === 0 ? <p>You haven&apos;t added any venues yet. Add one now so guests get directions.</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>Go back</Button>
          <Button variant={allVenues.length === 0 ? "secondary" : "primary"} onClick={() => confirm && save(confirm)} loading={pending}>Continue without venue</Button>
          {allVenues.length === 0 ? <Button onClick={() => { setConfirm(null); setAddingVenue(true); }} disabled={pending}>Add a venue</Button> : null}
        </div>
      </Modal>
    </>
  );
}

/** Add/edit an event in a dialog (Events tab). */
export function EventDialog({ weddingId, event, events, venues, covers, onClose }: {
  weddingId: string; event: WeddingEvent | "new" | null; events: WeddingEvent[]; venues: Venue[]; covers: Media[]; onClose: () => void;
}) {
  const existing = event && event !== "new" ? event : null;
  return (
    <Modal open={event !== null} onClose={onClose} title={existing ? "Edit event" : "Add event"}>
      <EventFormBody weddingId={weddingId} existing={existing} venues={venues} covers={covers}
        initialVenueId={defaultVenueId(events, venues)} onSaved={onClose} onCancel={onClose} />
    </Modal>
  );
}

/** Where to find a map link: shown from the "?" beside the field. */
export function MapLinkHelp() {
  return (
    <HelpTip label="How do I get a map link?">
      <span className="block font-semibold">Getting a Google Maps link</span>
      <span className="mt-2 block"><b>On your phone:</b> open Google Maps, search for the venue, tap <b>Share</b>, then <b>Copy link</b>.</span>
      <span className="mt-2 block"><b>On a computer:</b> go to google.com/maps, search for the venue, click <b>Share</b>, then <b>Copy link</b>.</span>
      <span className="mt-2 block">Paste it here. It looks like https://maps.app.goo.gl/… If you don&apos;t add one, guests get directions from the address.</span>
    </HelpTip>
  );
}

/** Add/edit a venue in a dialog. `onSaved` gets the saved venue (an event form selects it). */
export function VenueDialog({ weddingId, venue, onClose, onSaved }: {
  weddingId: string; venue: Venue | "new" | null; onClose: () => void; onSaved?: (venue: Venue) => void;
}) {
  const existing = venue && venue !== "new" ? venue : null;
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const input: VenueInput = {
        name: String(formData.get("name") ?? ""), addressLine: String(formData.get("addressLine") ?? ""),
        city: String(formData.get("city") ?? ""), state: String(formData.get("state") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""), mapUrl: String(formData.get("mapUrl") ?? ""),
      };
      if (!input.name.trim()) {
        setProblem({ status: 400, code: "client.invalid", message: "Enter the venue name.", fieldErrors: { name: ["Enter the venue name."] } });
        return;
      }
      const result = await saveVenueAction(weddingId, existing?.id ?? null, input);
      if (result.ok) { setProblem(null); if (onSaved) onSaved(result.data); else onClose(); } else setProblem(result.error);
    });
  };

  return (
    <Modal open={venue !== null} onClose={onClose} title={existing ? "Edit venue" : "Add venue"}>
      <form key={existing?.id ?? "new"} onSubmit={submit} className="space-y-4" noValidate>
        {problem ? <Alert tone="error">{problem.message}</Alert> : null}
        <TextField label="Venue name" name="name" required defaultValue={existing?.name} errors={errorsFor(problem, "name")} />
        <TextField label="Address" name="addressLine" defaultValue={existing?.addressLine ?? ""} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="City" name="city" defaultValue={existing?.city ?? ""} />
          <TextField label="State" name="state" defaultValue={existing?.state ?? ""} />
          <TextField label="PIN code" name="postalCode" defaultValue={existing?.postalCode ?? ""} />
        </div>
        <TextField label="Map link (optional)" name="mapUrl" type="url" defaultValue={existing?.mapUrl ?? ""} placeholder="https://maps.app.goo.gl/…"
          labelAction={<MapLinkHelp />} hint="Guests tap this to open the venue in Google Maps. If you leave it empty, we use the address instead." errors={errorsFor(problem, "mapUrl")} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>{existing ? "Save venue" : "Add venue"}</Button>
        </div>
      </form>
    </Modal>
  );
}

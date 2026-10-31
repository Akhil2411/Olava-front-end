"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, ConfirmDialog, Modal, SelectField, TextArea, TextField } from "@/components/ui";
import { newId } from "@/features/editor/context";
import { deleteEventAction, saveEventAction, type EventInput } from "@/features/events/actions";
import { defaultVenueId, VenueDialog } from "@/features/events/components/EventForm";
import { EVENT_SUGGESTIONS, eventTypeOptions } from "@/features/events/types";
import type { Media, Venue, WeddingEvent } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import type { Saver } from "./SetupWizard";

type Draft = {
  key: string; id: string | null; name: string; eventType: string; date: string; time: string; endTime: string;
  venueId: string; dressCode: string; description: string; notes: string; coverMediaId: string; isVisible: boolean;
  /** What was last saved (to save only changed events). */
  saved: string | null;
};
type Problems = Partial<Record<"name" | "date" | "time", string>>;

const addDay = (date: string) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

function fromEvent(e: WeddingEvent): Draft {
  const d: Draft = {
    key: newId("e"), id: e.id, name: e.name, eventType: e.eventType ?? "", date: e.startsAtLocal.slice(0, 10), time: e.startsAtLocal.slice(11, 16),
    endTime: e.endsAtLocal ? e.endsAtLocal.slice(11, 16) : "", venueId: e.venueId ?? "", dressCode: e.dressCode ?? "", description: e.description ?? "",
    notes: e.notes ?? "", coverMediaId: e.coverMediaId ?? "", isVisible: e.isVisible, saved: null,
  };
  return { ...d, saved: JSON.stringify(toInput(d)) };
}

function toInput(d: Draft): EventInput {
  const start = `${d.date}T${d.time}`;
  // An end time at or before the start is the next day (an evening that runs past midnight).
  const end = d.endTime ? `${d.endTime <= d.time ? addDay(d.date) : d.date}T${d.endTime}` : null;
  return {
    name: d.name.trim(), eventType: d.eventType || null, startsAtLocal: start, endsAtLocal: end, venueId: d.venueId || null,
    dressCode: d.dressCode || null, description: d.description || null, notes: d.notes || null, coverMediaId: d.coverMediaId || null, isVisible: d.isVisible,
  };
}

/** Nothing typed yet (the date, type and venue may be prefilled): ignored, never saved. */
const isBlank = (d: Draft) => !d.name.trim() && !d.time && !d.description.trim() && !d.notes.trim() && !d.dressCode.trim();

function problemsOf(d: Draft): Problems {
  const p: Problems = {};
  if (!d.name.trim()) p.name = "Give this event a name.";
  if (!d.date) p.date = "Choose the date.";
  if (!d.time) p.time = "Choose the start time.";
  return p;
}

const listOf = (names: string[]) => names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/**
 * The walkthrough's events: every event is an open card (add as many as needed, no save in between), with one-tap
 * suggestions. Everything is saved on Next; events without a venue are named in one question first. Back and
 * Skip save the complete events without asking. Deleting a saved event asks, then deletes it straight away.
 */
export function EventsStep({ weddingId, weddingDate, events, venues: initialVenues, images, register, onConfirmed }: {
  weddingId: string; weddingDate: string | null; events: WeddingEvent[]; venues: Venue[]; images: Media[];
  register: (fn: Saver) => void; onConfirmed: () => void;
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const list = [...events].sort((a, b) => a.sortOrder - b.sortOrder).map(fromEvent);
    return list.length ? list : [blank(weddingDate ?? "", defaultVenueId(events, initialVenues))];
  });
  const [problems, setProblems] = useState<Record<string, Problems>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [addingVenueFor, setAddingVenueFor] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Draft | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [asking, setAsking] = useState<string[] | null>(null);
  /** The events (by key) already accepted without a venue; asked again only if that list changes. */
  const accepted = useRef<string | null>(null);

  function blank(date: string, venueId: string, name = "", eventType = ""): Draft {
    return { key: newId("e"), id: null, name, eventType, date, time: "", endTime: "", venueId, dressCode: "", description: "", notes: "", coverMediaId: "", isVisible: true, saved: null };
  }
  const set = (key: string, patch: Partial<Draft>) => {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setProblems((p) => (p[key] ? { ...p, [key]: {} } : p));
  };
  const add = (name = "", eventType = "") => {
    const last = drafts.at(-1);
    // A suggestion fills an untouched last card rather than adding another.
    if (name && last && isBlank(last) && !last.name) {
      set(last.key, { name, eventType });
      setFocusKey(last.key);
      return;
    }
    const d = blank(last?.date || weddingDate || "", last?.venueId || defaultVenueId(events, venues), name, eventType);
    setDrafts((ds) => [...ds, d]);
    setFocusKey(d.key);
  };

  useEffect(() => {
    register(async (strict) => {
      const live = drafts.filter((d) => !isBlank(d));
      if (strict) {
        const found: Record<string, Problems> = {};
        for (const d of live) { const p = problemsOf(d); if (Object.keys(p).length) found[d.key] = p; }
        setProblems(found);
        if (Object.keys(found).length) return false;
        const noVenue = live.filter((d) => !d.venueId);
        const signature = noVenue.map((d) => d.key).join(",");
        if (noVenue.length && accepted.current !== signature) { setAsking(noVenue.map((d) => d.name.trim())); return false; }
      }
      for (const d of live) {
        if (Object.keys(problemsOf(d)).length) continue; // Back / Skip: incomplete cards stay unsaved
        const input = toInput(d);
        const json = JSON.stringify(input);
        if (d.saved === json) continue;
        const result = await saveEventAction(weddingId, d.id, input);
        if (!result.ok) {
          if (strict) { setProblems((p) => ({ ...p, [d.key]: { name: result.error.message } })); return false; }
          continue;
        }
        setDrafts((ds) => ds.map((x) => (x.key === d.key ? { ...x, id: result.data.id, saved: json } : x)));
        d.id = result.data.id; d.saved = json; // a second press of Next must not create it twice
      }
      return true;
    });
  });

  const confirmRemove = async () => {
    const d = removing;
    if (!d) return;
    if (d.id) {
      const result = await deleteEventAction(weddingId, d.id);
      if (!result.ok) { setRemoveError(result.error.message); return; }
    }
    setRemoving(null); setRemoveError(null);
    setDrafts((ds) => {
      const left = ds.filter((x) => x.key !== d.key);
      return left.length ? left : [blank(weddingDate ?? "", defaultVenueId(events, venues))];
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">Add an event</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Suggested events">
          {EVENT_SUGGESTIONS.map((s) => {
            const used = drafts.some((d) => d.name.trim().toLowerCase() === s.name.toLowerCase());
            return (
              <button key={s.name} type="button" onClick={() => add(s.name, s.type)}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition", used ? "border-pink-dark bg-blush text-pink-dark" : "border-line bg-white hover:bg-tint")}>
                {used ? "✓" : "+"} {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <ol className="space-y-4">
        {drafts.map((d, i) => {
          const p = problems[d.key] ?? {};
          const more = open[d.key] ?? !!(d.dressCode || d.description || d.notes || d.coverMediaId || !d.isVisible);
          const label = d.name.trim() || `Event ${i + 1}`;
          return (
            <li key={d.key}>
              <fieldset className={cn("rounded-2xl border p-4", Object.keys(p).length ? "border-danger" : "border-line")}>
                <legend className="sr-only">{label}</legend>
                <div className="-mt-1 mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
                  <p className="min-w-0 truncate text-sm font-semibold" aria-hidden="true">
                    {label}{d.id ? <span className="ml-2 text-xs font-normal text-success">✓ Saved</span> : null}
                  </p>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => (d.id || !isBlank(d) ? setRemoving(d) : confirmRemoveBlank(d.key))}>
                    Delete<span className="sr-only"> {label}</span>
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
                    <TextField label="Event name" required value={d.name} maxLength={150} placeholder="e.g. Wedding" autoFocus={focusKey === d.key}
                      errors={p.name ? [p.name] : undefined} onChange={(e) => set(d.key, { name: e.target.value })} />
                    <SelectField label="Type" value={d.eventType} onChange={(e) => set(d.key, { eventType: e.target.value })}>
                      <option value="">None</option>
                      {eventTypeOptions(d.eventType).map((t) => <option key={t} value={t}>{t}</option>)}
                    </SelectField>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <TextField label="Date" type="date" required value={d.date} errors={p.date ? [p.date] : undefined} onChange={(e) => set(d.key, { date: e.target.value })} />
                    <TextField label="Starts" type="time" required value={d.time} errors={p.time ? [p.time] : undefined} onChange={(e) => set(d.key, { time: e.target.value })} />
                    <TextField label="Ends (optional)" type="time" value={d.endTime} onChange={(e) => set(d.key, { endTime: e.target.value })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <SelectField label="Venue" value={d.venueId} onChange={(e) => set(d.key, { venueId: e.target.value })} wrapperClassName="min-w-0 flex-1">
                      <option value="">No venue</option>
                      {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </SelectField>
                    <Button size="sm" variant="secondary" className="h-12 shrink-0" onClick={() => setAddingVenueFor(d.key)}>+ New venue<span className="sr-only"> for {label}</span></Button>
                  </div>
                  {more ? (
                    <div className="space-y-3 rounded-xl bg-tint/60 p-3">
                      <TextField label="Dress code" value={d.dressCode} maxLength={200} placeholder="e.g. Kasavu, pastels" onChange={(e) => set(d.key, { dressCode: e.target.value })} />
                      <TextArea label="Description" value={d.description} maxLength={2000} rows={2} onChange={(e) => set(d.key, { description: e.target.value })} />
                      <TextArea label="Notes for guests" value={d.notes} maxLength={2000} rows={2} hint="Parking, timings, anything guests should know." onChange={(e) => set(d.key, { notes: e.target.value })} />
                      {images.length ? (
                        <SelectField label="Cover image (optional)" value={d.coverMediaId} onChange={(e) => set(d.key, { coverMediaId: e.target.value })}>
                          <option value="">None</option>
                          {images.map((m, n) => <option key={m.id} value={m.id}>{m.caption || `Photo ${n + 1}`}</option>)}
                        </SelectField>
                      ) : null}
                      <Checkbox label="Show this event on the website" checked={d.isVisible} onChange={(e) => set(d.key, { isVisible: e.target.checked })} />
                    </div>
                  ) : null}
                  <button type="button" aria-expanded={more} onClick={() => setOpen((o) => ({ ...o, [d.key]: !more }))}
                    className="self-start text-left text-sm font-semibold text-pink-dark underline-offset-4 hover:underline">
                    {more ? "− Fewer details" : "+ More details"}<span className="sr-only"> for {label}</span>
                    {!more ? <span className="font-normal text-mute"> (dress code, notes, cover photo)</span> : null}
                  </button>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      {drafts.length < 30 ? <Button variant="secondary" onClick={() => add()}>+ Add another event</Button> : null}

      <VenueDialog weddingId={weddingId} venue={addingVenueFor ? "new" : null} onClose={() => setAddingVenueFor(null)}
        onSaved={(v) => { setVenues((list) => [...list.filter((x) => x.id !== v.id), v]); if (addingVenueFor) set(addingVenueFor, { venueId: v.id }); setAddingVenueFor(null); }} />

      <ConfirmDialog open={removing !== null} onClose={() => { setRemoving(null); setRemoveError(null); }} onConfirm={() => void confirmRemove()}
        title={`Delete ${removing?.name.trim() || "this event"}?`} confirmLabel="Delete event">
        <p>{removing?.id ? "It will be removed from your website." : "What you typed for it will be lost."}</p>
        {removeError ? <p className="mt-2 text-danger">{removeError}</p> : null}
      </ConfirmDialog>

      <Modal open={asking !== null} onClose={() => setAsking(null)} title="No venue selected">
        <div className="space-y-3 text-sm text-mute">
          <p>{asking && asking.length === 1 ? `${asking[0]} has no venue. It` : `${listOf(asking ?? [])} have no venue. They`} will appear on your website without a location. Do you want to continue anyway?</p>
          {venues.length === 0 ? <p>You haven&apos;t added any venues yet. Use <b>+ New venue</b> on an event so guests get directions.</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setAsking(null)}>Go back</Button>
          <Button onClick={() => {
            accepted.current = drafts.filter((d) => !isBlank(d) && !d.venueId).map((d) => d.key).join(",");
            setAsking(null);
            onConfirmed();
          }}>Continue without venue</Button>
        </div>
      </Modal>
    </div>
  );

  function confirmRemoveBlank(key: string) {
    setDrafts((ds) => {
      const left = ds.filter((x) => x.key !== key);
      return left.length ? left : [blank(weddingDate ?? "", defaultVenueId(events, venues))];
    });
  }
}

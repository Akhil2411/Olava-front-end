"use client";

import { useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Alert, BottomSheet, Button, ConfirmDialog, LinkButton, Switch } from "@/components/ui";
import { PreviewWindow } from "@/features/preview/PreviewWindow";
import type { Media, MusicSettings, Section, SectionTypeInfo, SiteModel, SiteMusic, Template, Venue, Wedding, WeddingEvent } from "@/lib/api/types";
import { EventDialog } from "@/features/events/components/EventForm";
import { coverChoices } from "@/features/events/covers";
import { cn } from "@/lib/utils/cn";
import { TemplatePicker } from "@/features/design/components/TemplatePicker";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { withDraftSections } from "@/templates/draft";
import type { EditSelection } from "@/templates/types";
import { EditorContext, type EditorEnv } from "./context";
import { MusicPanel } from "./MusicPanel";
import { ScrollTopButton } from "./ScrollTopButton";
import { SectionForm } from "./SectionForm";
import { SectionsPanel, sectionTitle } from "./SectionsPanel";
import { withSamples } from "@/templates/samples";
import { useSections, type SaveState } from "./useSections";

type Panel = { kind: "sections" } | { kind: "theme" } | { kind: "music" } | { kind: "section"; id: string; field: string };

/** What the preview's music button shows for the current settings (null when music is off or not offered). */
function previewMusic(m: MusicSettings): SiteMusic | null {
  if (!m.available || !m.enabled) return null;
  const custom = m.track === "custom" && m.upload;
  return {
    track: custom ? "custom" : m.track && m.track !== "custom" ? m.track : m.defaultTrack,
    audio: custom ? { ref: m.upload!.mediaId, contentType: m.upload!.contentType } : null,
    icon: m.icon, color: m.color, position: m.position,
  };
}

const DESKTOP = "(min-width: 1024px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(DESKTOP); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(DESKTOP).matches,
    () => false, // mobile-first on the server
  );
}

function StatusText({ state, onRetry }: { state: SaveState; onRetry?: () => void }) {
  switch (state.kind) {
    case "saving": return <span className="text-mute">Saving…</span>;
    case "pending": return <span className="text-mute">Editing…</span>;
    case "blocked": return <span className="text-warning">Not saved yet: {state.message}</span>;
    case "error": return <span className="text-danger">Couldn&apos;t save: {state.message} {onRetry ? <button type="button" className="underline" onClick={onRetry}>Retry</button> : null}</span>;
    default: return <span className="text-success">✓ Saved to your draft</span>;
  }
}

/**
 * The site editor. The live preview (the real template renderer) shows the draft as you type; tap any text or
 * photo to edit it. Mobile: the editor opens in a bottom sheet. Desktop: editor panel beside the preview.
 * Every change autosaves to the private draft; guests only see it after Publish.
 */
export function SiteEditor({ wedding, preview, sections: initialSections, library, media: allMedia, music: initialMusic, templates, entitledRank, readOnly, initialSection, initialPanel, events, venues }: {
  wedding: Wedding; preview: SiteModel; sections: Section[]; library: SectionTypeInfo[]; media: Media[]; music: MusicSettings;
  /** The wedding's events and venues: tapping an event (or its photo) in the preview edits it right here. */
  events: WeddingEvent[]; venues: Venue[];
  templates: Template[]; entitledRank: number | null; readOnly: boolean;
  /** Open this section's form straight away (links from the Publish page). */
  initialSection?: string;
  /** "template": open the Template & colours panel (links such as "Change template"). */
  initialPanel?: "template";
}) {
  // Photos only: the couple's music track and videos are media items too, but never offered as images.
  const initialMedia = useMemo(() => allMedia.filter((m) => m.purpose !== "Music" && m.purpose !== "Video"), [allMedia]);
  const initialVideos = useMemo(() => allMedia.filter((m) => m.purpose === "Video"), [allMedia]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [music, setMusic] = useState(initialMusic);
  const weddingId = wedding.id;
  const desktop = useIsDesktop();
  const state = useSections(weddingId, initialSections);
  const { sections, states } = state;
  const [panel, setPanel] = useState<Panel | null>(() =>
    initialSection && initialSections.some((x) => x.id === initialSection) ? { kind: "section", id: initialSection, field: "" }
      : initialPanel === "template" ? { kind: "theme" } : null);
  // A different panel (or another section) starts at its top, not where the previous one was scrolled to.
  const asideRef = useRef<HTMLElement>(null);
  const panelKey = panel ? (panel.kind === "section" ? `section:${panel.id}` : panel.kind) : "none";
  useLayoutEffect(() => { asideRef.current?.scrollTo({ top: 0 }); }, [panelKey]);
  const [uploaded, setUploaded] = useState<Media[]>([]);
  const [phone, setPhone] = useState(false);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [pending, start] = useTransition();

  // Server media (refreshed after gallery changes) plus anything uploaded in this session.
  const media = useMemo(() => [...initialMedia, ...uploaded.filter((u) => u.purpose !== "Video" && !initialMedia.some((m) => m.id === u.id))]
    .filter((m) => !removed.includes(m.id)), [initialMedia, uploaded, removed]);
  const videos = useMemo(() => [...initialVideos, ...uploaded.filter((u) => u.purpose === "Video" && !initialVideos.some((m) => m.id === u.id))]
    .filter((m) => !removed.includes(m.id)), [initialVideos, uploaded, removed]);
  const site = useMemo(() => ({ ...withDraftSections(preview, sections, [...media, ...videos]), music: previewMusic(music) }), [preview, sections, media, videos, music]);

  // Sections that still show sample content (empty): badged in the Sections list.
  const sampleIds = useMemo(() => new Set(withSamples(site).sections.filter((x) => x.sample && x.id).map((x) => x.id!)), [site]);

  const active = panel ?? (desktop ? { kind: "sections" as const } : null);
  const current = active?.kind === "section" ? sections.find((s) => s.id === active.id) ?? null : null;
  const selected: EditSelection | null = active?.kind === "section" ? { sectionId: active.id, field: active.field } : null;

  const env: EditorEnv = {
    weddingId, media, videos, readOnly,
    onUploaded: (m) => setUploaded((u) => [...u, m]),
    onRemoved: (id) => setRemoved((r) => [...r, id]),
    focusField: active?.kind === "section" ? active.field : null,
    partnerNames: [wedding.partnerOneName || "Partner one", wedding.partnerTwoName || "Partner two"],
    design: preview.template.layout,
  };

  const open = (id: string, field = "") => setPanel({ kind: "section", id, field });

  // Tapping an event or its cover photo opens that event (name, time, venue, cover photo) in a dialog. Events
  // live outside the sections, so the preview reloads from the server after a save.
  const router = useRouter();
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const select = (sectionId: string, field: string) => {
    open(sectionId, field);
    const m = /^events\.(\d+)(?:\.cover)?$/.exec(field);
    const shown = m && !readOnly ? preview.events[Number(m[1])] : null; // sample events (none added yet) have no match
    const event = shown ? events.find((e) => e.isVisible && e.name === shown.name && e.startsAt === shown.startsAt) : null;
    if (event) setEditingEvent(event);
  };

  const panelTitle = active?.kind === "theme" ? "Template & colours" : active?.kind === "music" ? "Music" : current ? current.label : "Sections";

  const panelBody: ReactNode = !active ? null : active.kind === "theme" ? (
    <TemplatePicker wedding={wedding} templates={templates} entitledRank={entitledRank} readOnly={readOnly} embedded />
  ) : active.kind === "music" ? (
    <MusicPanel weddingId={weddingId} music={music} palette={preview.theme.palette} readOnly={readOnly} onChange={setMusic} />
  ) : active.kind === "sections" || !current ? (
    <SectionsPanel sections={sections} library={library} states={states} sampleIds={sampleIds}
      onOpen={(id) => open(id)}
      onToggle={(id, isEnabled) => state.update(id, { isEnabled })}
      onDelete={state.remove}
      onReorder={(ids) => void state.reorder(ids)}
      onAdd={async (type) => {
        const result = await state.add(type, current?.id ?? null);
        if (result.ok) open(result.data.id);
        return result;
      }} />
  ) : (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setPanel({ kind: "sections" })}>← All sections</Button>
        <span className="ml-auto text-xs" role="status"><StatusText state={states[current.id] ?? { kind: "saved" }} onRetry={() => state.retry(current.id)} /></span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-tint p-3">
        <div>
          <p className="font-semibold">{current.label}</p>
          {current.isRequired ? <p className="text-xs text-mute">Always shown on your website.</p> : null}
        </div>
        {!current.isRequired ? (
          <div className="flex items-center gap-2">
            <Switch label="Show section" checked={current.isEnabled} disabled={readOnly} onChange={(v) => state.update(current.id, { isEnabled: v })} />
            <Button size="sm" variant="ghost" className="text-danger" disabled={readOnly} onClick={() => setDeleting(current)}>Delete</Button>
          </div>
        ) : null}
      </div>
      {!current.isEnabled && current.disableWarning ? <Alert tone="warning">{current.disableWarning}</Alert> : null}
      <fieldset disabled={readOnly} className="min-w-0">
        <legend className="sr-only">{current.label} content</legend>
        <SectionForm key={current.id} section={current}
          onContent={(content) => state.update(current.id, { content })}
          onLayout={(layoutVariant) => state.update(current.id, { layoutVariant })} />
      </fieldset>
    </div>
  );

  return (
    <EditorContext.Provider value={env}>
      <div className="space-y-4">
        <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-line bg-white px-4 py-2 sm:mx-0 sm:rounded-full sm:border sm:px-3">
          <Button size="sm" variant={active?.kind === "sections" || active?.kind === "section" ? "primary" : "secondary"}
            onClick={() => setPanel({ kind: "sections" })}>☰ Sections</Button>
          <Button size="sm" variant={active?.kind === "theme" ? "primary" : "secondary"} onClick={() => setPanel({ kind: "theme" })}>🎨 Template</Button>
          {music.available ? (
            <Button size="sm" variant={active?.kind === "music" ? "primary" : "secondary"} onClick={() => setPanel({ kind: "music" })}>🎵 Music</Button>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-xs sm:text-sm" role="status" aria-live="polite"><StatusText state={state.overall} /></span>
          <Button size="sm" variant="ghost" onClick={() => setPhone(true)}>👁 Preview</Button>
          <LinkButton size="sm" variant="ghost" href={`/dashboard/weddings/${weddingId}/publish`}>Publish →</LinkButton>
        </div>

        {state.notice ? <Alert tone="warning" action={<Button size="sm" variant="ghost" onClick={state.dismissNotice}>OK</Button>}>{state.notice}</Alert> : null}
        {readOnly ? <Alert tone="info">This project is archived. Restore it in Settings to make changes.</Alert> : null}

        <div className="lg:grid lg:grid-cols-[minmax(340px,420px)_1fr] lg:items-start lg:gap-6">
          {desktop ? (
            <aside ref={asideRef} aria-label="Editor" className="min-w-0 sticky top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-line bg-white p-5">
              <h2 className="mb-4 text-2xl">{panelTitle}</h2>
              {panelBody}
              <ScrollTopButton target={asideRef} label="Back to the top of the panel" className="sticky bottom-0 ml-auto mt-4" />
            </aside>
          ) : null}
          <div aria-label="Live preview" role="region" className="overflow-hidden rounded-[22px] border border-line shadow-sm">
            <SiteRenderer site={site} mode="edit" imageUrl={(img, variant) => `/api/media/${weddingId}/${img.ref}/${variant}`}
              edit={{ selected, onSelect: ({ sectionId, field }) => select(sectionId, field) }} />
          </div>
        </div>

        <ScrollTopButton label="Back to the top of the page" className="fixed bottom-5 right-5 z-30" />

        <EventDialog weddingId={weddingId} event={editingEvent} events={events} venues={venues} covers={coverChoices(allMedia)}
          onClose={() => { setEditingEvent(null); router.refresh(); }} />

        {!desktop ? (
          <BottomSheet open={panel !== null} onClose={() => setPanel(null)} title={panelTitle}>
            {panelBody}
          </BottomSheet>
        ) : null}

        <PreviewWindow open={phone} onClose={() => setPhone(false)} title="Preview" src={`/preview/${weddingId}`}
          note="Your saved draft as guests will see it on a phone, tablet or computer. Unsaved typing appears after it saves." />

        <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending}
          title={`Delete “${deleting ? sectionTitle(deleting) || deleting.label : ""}”?`} confirmLabel="Delete section"
          onConfirm={() => start(async () => {
            if (!deleting) return;
            const result = await state.remove(deleting.id);
            setDeleting(null);
            if (result.ok) setPanel({ kind: "sections" });
          })}>
          <p>The section and everything in it will be removed from your draft. Photos stay in your library.</p>
          {deleting?.disableWarning ? <p className="font-medium text-warning">{deleting.disableWarning}</p> : null}
          <p>Your live website changes only when you publish again.</p>
        </ConfirmDialog>
      </div>
      <span className={cn("sr-only")}>{pending ? "Working…" : ""}</span>
    </EditorContext.Provider>
  );
}

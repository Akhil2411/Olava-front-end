"use client";
import type React from "react";

import { useState, useTransition } from "react";
import { Alert, Badge, Button, ConfirmDialog, Switch } from "@/components/ui";
import type { Section, SectionTypeInfo, SectionType } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { useEditor } from "./context";
import { SortableList } from "./SortableList";
import type { SaveState } from "./useSections";

/** A short summary line for a section (its heading, if any). */
export function sectionTitle(s: Section): string {
  const h = s.content.heading;
  const text = h && typeof h === "object" ? (h as { text?: unknown }).text : null;
  return typeof text === "string" && text.trim() ? text : "";
}

/**
 * The "Sections" screen: reorder (drag handle or arrows), show/hide, open, delete (with confirmation),
 * and add sections from the library. The footer is always last.
 */
export function SectionsPanel({ sections, library, states, onOpen, onToggle, onDelete, onReorder, onAdd, sampleIds }: {
  sections: Section[];
  /** Sections still showing sample content (empty): they get a "Sample" badge and won't appear on the live site. */
  sampleIds?: ReadonlySet<string>;
  library: SectionTypeInfo[];
  states: Record<string, SaveState>;
  onOpen: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>;
  onReorder: (ids: string[]) => void;
  onAdd: (type: SectionType) => Promise<{ ok: boolean; error?: { message: string } }>;
}) {
  const { readOnly } = useEditor();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const movable = sections.filter((s) => !s.isPinnedLast);
  const pinned = sections.filter((s) => s.isPinnedLast);
  // Library entries that already exist once (singletons) can't be added again.
  const canAddAny = library.some((l) => l.canAdd && (!l.isSingleton || !sections.some((s) => s.type === l.type)));

  const row = (s: Section, controls?: { handle: React.ReactNode; arrows: React.ReactNode }) => {
    const title = sectionTitle(s);
    const state = states[s.id];
    return (
      <div className={cn("flex items-center gap-1 rounded-2xl border p-2", s.isEnabled ? "border-line bg-white" : "border-dashed border-line bg-blush/50")}>
        {controls?.handle ?? <span className="w-9" aria-hidden="true" />}
        <button type="button" onClick={() => onOpen(s.id)} className="min-w-0 flex-1 rounded-xl px-2 py-1 text-left hover:bg-tint">
          {/* The name in full on its own line; what it says and its state underneath. */}
          <span className="block break-words font-semibold leading-snug">{s.label}</span>
          {!s.isEnabled || sampleIds?.has(s.id) || (title && title !== s.label) ? (
            <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-mute">
              {!s.isEnabled ? <Badge tone="neutral" className="shrink-0">Hidden</Badge> : null}
              {sampleIds?.has(s.id) ? <Badge tone="warning" className="shrink-0">Sample<span className="sr-only">: showing sample content, hidden on your live site until you add your own</span></Badge> : null}
              {title && title !== s.label ? <span className="min-w-0 truncate">{title}</span> : null}
            </span>
          ) : null}
          {state?.kind === "error" || state?.kind === "blocked" ? <span className="block text-xs font-medium text-danger">{state.message}</span> : null}
        </button>
        {controls?.arrows}
        {s.isRequired ? <Badge tone="neutral" className="hidden sm:inline-flex">Required</Badge> : (
          <Switch hideLabel label={`Show ${s.label} on the website`} checked={s.isEnabled} disabled={readOnly} onChange={(v) => onToggle(s.id, v)} />
        )}
        {!s.isRequired ? (
          <Button variant="ghost" size="sm" aria-label={`Delete ${s.label}${title ? ` (${title})` : ""}`} disabled={readOnly} onClick={() => setDeleting(s)}>
            <span aria-hidden="true">🗑</span>
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {sampleIds && sections.some((s) => sampleIds.has(s.id)) ? (
        <p className="rounded-2xl bg-tint/70 px-3 py-2 text-xs text-mute">
          <Badge tone="warning" className="mr-1.5">Sample</Badge>Showing sample content: hidden on your live site until you add your own.
        </p>
      ) : null}
      <SortableList items={movable} getId={(s) => s.id} getLabel={(s) => s.label + (sectionTitle(s) ? `, ${sectionTitle(s)}` : "")}
        disabled={readOnly} onReorder={onReorder} className="space-y-2"
        renderItem={(s, c) => row(s, c)} />
      <ul className="space-y-2">{pinned.map((s) => <li key={s.id}>{row(s)}</li>)}</ul>

      {!readOnly ? (
        adding ? (
          <div className="rounded-2xl border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Add a section</p>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {library.map((l) => {
                const exists = l.isSingleton && sections.some((s) => s.type === l.type);
                const disabled = !l.canAdd || exists || pending;
                return (
                  <li key={l.type}>
                    <button type="button" disabled={disabled}
                      onClick={() => start(async () => {
                        const result = await onAdd(l.type);
                        setError(result.ok ? null : result.error?.message ?? "Couldn't add the section.");
                        if (result.ok) setAdding(false);
                      })}
                      className="h-full w-full rounded-xl border border-line p-3 text-left hover:border-pink-dark hover:bg-tint disabled:cursor-not-allowed disabled:opacity-50">
                      <span className="block font-semibold">{l.label}</span>
                      <span className="block text-xs text-mute">{exists ? "Already on your website" : l.description}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <Button variant="secondary" block disabled={!canAddAny} onClick={() => setAdding(true)}>＋ Add section</Button>
        )
      ) : null}

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending}
        title={`Delete “${deleting ? sectionTitle(deleting) || deleting.label : ""}”?`} confirmLabel="Delete section"
        onConfirm={() => start(async () => {
          if (!deleting) return;
          const result = await onDelete(deleting.id);
          setError(result.ok ? null : result.error?.message ?? "Couldn't delete the section.");
          setDeleting(null);
        })}>
        <p>The section and everything in it will be removed from your draft. Photos stay in your library.</p>
        {deleting?.disableWarning ? <p className="font-medium text-warning">{deleting.disableWarning}</p> : null}
        <p>Your live website changes only when you publish again. To keep the content for later, hide the section instead.</p>
      </ConfirmDialog>
    </div>
  );
}

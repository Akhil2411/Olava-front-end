"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Section, SectionType } from "@/lib/api/types";
import { addSectionAction, deleteSectionAction, reorderSectionsAction, syncDraftAction, updateSectionAction } from "@/features/design/actions";
import { draftIssue } from "./SectionForm";

export type SaveState =
  | { kind: "saved" }
  | { kind: "pending" }
  | { kind: "saving" }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string };

const CONTENT_DELAY = 700;
/** After this quiet period following saves, the other tabs' cached pages are refreshed (banner, publish status). */
const SYNC_DELAY = 1500;

/**
 * The newest known version of each section, per wedding, kept across tab switches. Visited dashboard pages are
 * cached on the client for a short while (next.config staleTimes), so the Design page can come back with
 * slightly older props than what the editor last saved; the newer revision always wins.
 */
const latestKnown = new Map<string, Map<string, Section>>();

function mergeNewest(weddingId: string, fromServer: Section[]): Section[] {
  const known = latestKnown.get(weddingId);
  if (!known) return fromServer;
  return fromServer.map((s) => {
    const k = known.get(s.id);
    return k && k.revision >= s.revision ? k : s;
  });
}

/** Tests only. */
export function resetLatestKnown() { latestKnown.clear(); }

/**
 * The editor's draft sections with per-section autosave. Edits apply locally at once (the live preview
 * re-renders immediately) and are saved after a short pause. Each save sends the revision it was based on;
 * if the section changed elsewhere the API refuses and the latest version is loaded instead of overwriting it.
 */
export function useSections(weddingId: string, initial: Section[]) {
  const [sections, setSections] = useState<Section[]>(() => mergeNewest(weddingId, initial));
  const [states, setStatesRaw] = useState<Record<string, SaveState>>({});
  const statesRef = useRef<Record<string, SaveState>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const latest = useRef(sections);
  const edits = useRef<Record<string, number>>({});        // local edit counter per section
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const inFlight = useRef<Record<string, boolean>>({});
  const again = useRef<Record<string, boolean>>({});

  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    latest.current = sections;
    latestKnown.set(weddingId, new Map(sections.map((s) => [s.id, s])));
  }, [sections, weddingId]);

  const setState = (id: string, state: SaveState) => {
    statesRef.current = { ...statesRef.current, [id]: state };
    setStatesRaw(statesRef.current);
  };

  const saveRef = useRef<(id: string) => Promise<void>>(async () => {});
  const save = useCallback(async (id: string) => {
    const section = latest.current.find((s) => s.id === id);
    if (!section) return;
    const issue = draftIssue(section);
    if (issue) { setState(id, { kind: "blocked", message: issue }); return; }
    if (inFlight.current[id]) { again.current[id] = true; return; }

    inFlight.current[id] = true;
    const sentAt = edits.current[id] ?? 0;
    setState(id, { kind: "saving" });
    const result = await updateSectionAction(weddingId, id, {
      revision: section.revision, isEnabled: section.isEnabled, layoutVariant: section.layoutVariant, content: section.content,
    });
    inFlight.current[id] = false;

    if (result.ok) {
      const unchanged = (edits.current[id] ?? 0) === sentAt;
      // Keep anything typed while the save was in flight; otherwise adopt the server's normalised version.
      setSections((all) => all.map((s) => (s.id !== id ? s : unchanged ? result.data : { ...s, revision: result.data.revision })));
      latest.current = latest.current.map((s) => (s.id !== id ? s : unchanged ? result.data : { ...s, revision: result.data.revision }));
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => { syncTimer.current = undefined; void syncDraftAction(weddingId); }, SYNC_DELAY);
      if (unchanged && !again.current[id]) setState(id, { kind: "saved" });
      else { again.current[id] = false; void saveRef.current(id); }
      return;
    }
    if (result.error.code === "section.conflict" && result.error.details?.current) {
      const current = result.error.details.current as Section;
      setSections((all) => all.map((s) => (s.id === id ? current : s)));
      setState(id, { kind: "saved" });
      setNotice("This section was changed in another tab or by someone else, so the latest version was loaded. Please check it and make your change again.");
      return;
    }
    setState(id, { kind: "error", message: result.error.message });
  }, [weddingId]);

  useEffect(() => { saveRef.current = save; }, [save]);

  const schedule = useCallback((id: string, delay: number) => {
    clearTimeout(timers.current[id]);
    setState(id, { kind: "pending" });
    timers.current[id] = setTimeout(() => void save(id), delay);
  }, [save]);

  /** Local change to one section (content, visibility or layout) + autosave. */
  const update = useCallback((id: string, patch: Partial<Pick<Section, "content" | "isEnabled" | "layoutVariant">>) => {
    edits.current[id] = (edits.current[id] ?? 0) + 1;
    setSections((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    latest.current = latest.current.map((s) => (s.id === id ? { ...s, ...patch } : s));
    schedule(id, patch.content ? CONTENT_DELAY : 0);
  }, [schedule]);

  const retry = useCallback((id: string) => void save(id), [save]);

  const add = useCallback(async (type: SectionType, afterId?: string | null) => {
    const result = await addSectionAction(weddingId, type, afterId ?? null);
    if (!result.ok) return result;
    setSections((all) => {
      const movable = all.filter((s) => !s.isPinnedLast);
      const pinned = all.filter((s) => s.isPinnedLast);
      const at = afterId ? movable.findIndex((s) => s.id === afterId) + 1 : movable.length;
      movable.splice(at < 0 ? movable.length : at, 0, result.data);
      return [...movable, ...pinned];
    });
    return result;
  }, [weddingId]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteSectionAction(weddingId, id);
    if (result.ok) {
      clearTimeout(timers.current[id]);
      setSections((all) => all.filter((s) => s.id !== id));
    }
    return result;
  }, [weddingId]);

  const reorder = useCallback(async (ids: string[]) => {
    const before = latest.current;
    const byId = new Map(before.map((s) => [s.id, s]));
    const next = [...ids.map((id) => byId.get(id)!).filter(Boolean), ...before.filter((s) => s.isPinnedLast)];
    setSections(next);
    const result = await reorderSectionsAction(weddingId, ids);
    if (!result.ok) { setSections(before); setNotice(result.error.message); }
  }, [weddingId]);

  // Flush pending saves when leaving; warn while anything is unsaved.
  const busy = useMemo(() => Object.values(states).some((s) => s.kind === "pending" || s.kind === "saving" || s.kind === "blocked" || s.kind === "error"), [states]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (busy) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  // Leaving the editor (e.g. another section tab): send edits that were still waiting for the typing pause,
  // and refresh the other tabs' cached data right away instead of after SYNC_DELAY.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const [id, t] of Object.entries(pending)) {
        clearTimeout(t);
        if (statesRef.current[id]?.kind === "pending") void saveRef.current(id).then(() => syncDraftAction(weddingId));
      }
      if (syncTimer.current) { clearTimeout(syncTimer.current); void syncDraftAction(weddingId); }
    };
  }, [weddingId]);

  const overall: SaveState = useMemo(() => {
    const all = Object.values(states);
    return all.find((s) => s.kind === "error") ?? all.find((s) => s.kind === "blocked")
      ?? all.find((s) => s.kind === "saving") ?? all.find((s) => s.kind === "pending") ?? { kind: "saved" };
  }, [states]);

  return { sections, states, overall, notice, dismissNotice: () => setNotice(null), update, retry, add, remove, reorder };
}

"use client";

import { FaqPresetPicker } from "@/features/faq/FaqPresetPicker";
import { faqSample } from "@/features/faq/presets";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Checkbox, ConfirmDialog, LinkButton, SelectField, TextArea, TextField } from "@/components/ui";
import { EditorContext, newId, type EditorEnv } from "@/features/editor/context";
import { ImageField } from "@/features/editor/fields";
import { VideoField } from "@/features/editor/VideoField";
import { updateDesignAction } from "@/features/design/actions";
import { GalleryManager } from "@/features/gallery/components/GalleryManager";
import type { Media, Section, SectionType, Template, Venue, Wedding, WeddingEvent, WeddingSetup } from "@/lib/api/types";
import { DesignStep, type DesignChoice } from "./DesignStep";
import { EventsStep } from "./EventsStep";
import { cn } from "@/lib/utils/cn";
import { chooseSectionsAction, saveSetupSectionAction, updateCoupleAction, updateSetupAction } from "../actions";
import { DEFAULT_SELECTION, labelOf, OFFERED, stepsFor } from "../steps";

type Content = Record<string, unknown>;
const txt = (v: unknown) => (v && typeof v === "object" && typeof (v as { text?: unknown }).text === "string" ? (v as { text: string }).text : "");
const el = (text: string) => ({ text: text.trim() || null, hidden: false });
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const httpsOk = (u: string) => /^https:\/\/[^\s/]+\.[^\s]+/i.test(u.trim());

/** A step's form: returns its answers as a section-content patch (or an error to show). Null = nothing to save. */
type Collect = () => { patch: Content | null; error?: string };

/** Lets the wizard read a step form's current answers when Next / Back / Skip is pressed. */
function useCollect(register: (fn: Collect) => void, fn: Collect) {
  useEffect(() => { register(fn); });
}

/**
 * A step that saves itself (events, design): `strict` is Next (check everything, may ask a question first and
 * return false to stay), otherwise Back / Skip (save what can be saved, never stop).
 */
export type Saver = (strict: boolean) => Promise<boolean>;

export function SetupWizard({ wedding, setup, step, sections, events, venues, images, videos, gallery, galleryLimit, templates }: {
  wedding: Wedding; setup: WeddingSetup; step: string; sections: Section[]; events: WeddingEvent[]; venues: Venue[];
  images: Media[]; videos: Media[]; gallery: Media[]; galleryLimit: number; templates: Template[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  /** The current step form's answers (tagged with its step, so a previous step's form is never saved by mistake). */
  const collect = useRef<{ step: string; fn: Collect } | null>(null);
  const saver = useRef<{ step: string; fn: Saver } | null>(null);
  const [design, setDesign] = useState<DesignChoice>(wedding.template?.key ?? null);
  const [sectionChoice, setSectionChoice] = useState<SectionType[]>(() => [...new Set([...(setup.sections.length ? setup.sections : DEFAULT_SELECTION), "events" as SectionType])]);
  const [uploaded, setUploaded] = useState<Media[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const weddingId = wedding.id;
  const chosen = setup.sections.length ? setup.sections : DEFAULT_SELECTION;
  const steps = stepsFor(chosen);
  const index = Math.max(0, steps.indexOf(step));
  const section = (type: string) => sections.find((s) => s.type === type);

  const env: EditorEnv = useMemo(() => ({
    weddingId, readOnly: false, focusField: null,
    media: [...images, ...uploaded.filter((u) => u.purpose !== "Video")].filter((m) => !removed.includes(m.id)),
    videos: [...videos, ...uploaded.filter((u) => u.purpose === "Video")].filter((m) => !removed.includes(m.id)),
    onUploaded: (m) => setUploaded((u) => [...u, m]),
    onRemoved: (id) => setRemoved((r) => [...r, id]),
    partnerNames: [wedding.partnerOneName, wedding.partnerTwoName],
  }), [weddingId, images, videos, uploaded, removed, wedding.partnerOneName, wedding.partnerTwoName]);

  const go = (to: string) => router.push(`/dashboard/setup/${weddingId}?step=${to}`, { scroll: true });

  /** Saves this step's answers (if any). Returns false (and shows why) when they can't be saved. */
  const saveCurrent = async (strict: boolean): Promise<boolean> => {
    if (step === "design") {
      if (!design || design === wedding.template?.key) return true;
      const applied = await updateDesignAction(weddingId, { templateKey: design });
      if (!applied.ok && strict) { setError(applied.error.message); return false; }
      return true;
    }
    if (saver.current && saver.current.step === step) return saver.current.fn(strict);
    if (!collect.current || collect.current.step !== step) return true;
    const { patch, error: problem } = collect.current.fn();
    if (problem) { if (strict) { setError(problem); return false; } return true; }
    if (!patch) return true;
    const saved = await saveSetupSectionAction(weddingId, step as SectionType, patch);
    if (!saved.ok) { if (strict) { setError(saved.error.message); return false; } }
    return true;
  };

  const next = (selected?: SectionType[], couple?: Parameters<typeof updateCoupleAction>[1]) => start(async () => {
    setError(null);
    let list = steps;
    if (step === "couple" && couple) {
      const saved = await updateCoupleAction(weddingId, couple);
      if (!saved.ok) { setError(saved.error.message); return; }
    } else if (step === "sections" && selected) {
      const saved = await chooseSectionsAction(weddingId, selected);
      if (!saved.ok) { setError(saved.error.message); return; }
      list = stepsFor(saved.data.sections);
    } else if (!(await saveCurrent(true))) return;
    const to = list[Math.min(list.length - 1, list.indexOf(step) + 1)];
    await updateSetupAction(weddingId, to === "done" ? "done" : "in_progress", to);
    go(to);
  });

  const back = () => start(async () => {
    setError(null);
    await saveCurrent(false); // keep what was typed, even if it isn't complete yet
    const to = steps[Math.max(0, index - 1)];
    await updateSetupAction(weddingId, "in_progress", to === "couple" ? "design" : to);
    go(to);
  });

  const skip = () => start(async () => {
    await saveCurrent(false);
    await updateSetupAction(weddingId, "skipped", step === "couple" ? "design" : step);
    router.push(`/dashboard/weddings/${weddingId}?setup=skipped`);
  });

  const register = useCallback((fn: Collect) => { collect.current = { step, fn }; }, [step]);
  const registerSaver = useCallback((fn: Saver) => { saver.current = { step, fn }; }, [step]);
  const isLast = steps[index + 1] === "done";

  let body: ReactNode;
  switch (step) {
    case "couple": body = <CoupleStep wedding={wedding} onNext={(v) => next(undefined, v)} />; break;
    case "design": body = <DesignStep weddingId={weddingId} templates={templates} current={wedding.template?.key ?? null} choice={design} onChoose={setDesign} />; break;
    case "sections": body = <SectionsStep selected={sectionChoice} onChange={setSectionChoice} />; break;
    case "done": body = <DoneStep weddingId={weddingId} hasDesign={!!wedding.template} />; break;
    case "events": body = <EventsStep weddingId={weddingId} weddingDate={wedding.weddingDate} events={events} venues={venues} images={images}
      register={registerSaver} onConfirmed={() => next()} />; break;
    case "gallery": body = <GalleryManager weddingId={weddingId} media={gallery} limit={galleryLimit} readOnly={false} compact />; break;
    default: body = <SectionStep key={step} type={step} content={section(step)?.content ?? {}} register={register} weddingId={weddingId} />;
  }

  // What the step bar says beside Next (so the choice is visible without scrolling back up).
  const chosenTemplate = templates.find((t) => t.key === design);
  const status = step === "design" ? (chosenTemplate ? <>Selected: <b className="text-ink">{chosenTemplate.name}</b></> : "Decide later")
    : step === "sections" ? `${sectionChoice.length} selected` : null;
  const onNext = () => (step === "sections" ? next(sectionChoice) : next());
  return (
    <EditorContext.Provider value={env}>
      <div className={cn("wrap py-8", step === "design" || step === "done" ? "max-w-4xl" : "max-w-2xl")}>
        <p className="eyebrow" aria-live="polite">Step {index + 1} of {steps.length}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-tint" role="progressbar" aria-label="Setup progress"
          aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1}>
          <div className="h-full rounded-full bg-pink-dark transition-[width]" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>
        <h1 className="mt-6 text-5xl">{HEADINGS[step] ?? labelOf(step)}</h1>
        {INTROS[step] ? <p className="mt-2 text-mute">{INTROS[step]}</p> : null}
        <Card className="mt-6">
          {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
          {body}
          {step !== "done" ? (
            // Pinned to the bottom of the screen while the step is longer than the screen (design cards, events…).
            <div role="group" aria-label="Step navigation"
              className="sticky bottom-0 z-20 -mx-5 -mb-5 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-[22px] border-t border-line bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
              {index > 0 ? <Button variant="ghost" size="sm" onClick={back} disabled={pending}>← Back</Button> : null}
              <button type="button" onClick={skip} disabled={pending} className="text-sm font-medium text-mute underline-offset-4 hover:text-ink hover:underline">
                Skip this for now
              </button>
              <span className="ml-auto flex items-center gap-3">
                {status ? <span className="hidden text-sm text-mute sm:inline" aria-live="polite">{status}</span> : null}
                {step === "couple"
                  ? <Button type="submit" form="setup-couple" loading={pending}>Next</Button>
                  : <Button onClick={onNext} loading={pending}>{isLast ? "Finish" : "Next"}</Button>}
              </span>
              {status ? <span className="w-full text-xs text-mute sm:hidden" aria-hidden="true">{status}</span> : null}
            </div>
          ) : null}
        </Card>
        {step !== "done" ? <p className="mt-4 text-xs text-mute">Your answers are saved as you go. You can change everything later in the editor.</p> : null}
      </div>
    </EditorContext.Provider>
  );
}

const HEADINGS: Record<string, string> = {
  couple: "Let's start with the two of you", design: "Choose your design", sections: "What should your website include?", done: "Your website is taking shape",
  story: "Tell your story", events: "Add your events", gallery: "Add some photos", rsvp: "Replies from guests", welcome: "A note to your guests",
  dress_code: "What should guests wear?", wedding_party: "Your wedding party", video: "Add your video", travel: "Travel & stay",
  faq: "Questions guests often ask", registry: "Gifts", explore: "Things to do nearby",
};
const INTROS: Record<string, string> = {
  design: "Tap a design to choose it, or open Live preview to see your names in it. You can switch any time later without losing anything.",
  sections: "Choose what to show. You can add, hide or reorder sections any time later.",
  story: "A few lines is plenty. Add moments like where you met or the proposal, as many as you like.",
  events: "Add each celebration: tap a suggestion or “Add another event”. Everything is saved when you press Next.",
  gallery: "Upload a few favourites now, or skip and add them later.",
  video: "MP4 or WebM, up to 30 MB.",
};

// ───────────── steps ─────────────

function CoupleStep({ wedding, onNext }: {
  wedding: Wedding;
  onNext: (v: { partnerOneName: string; partnerTwoName: string; weddingDate: string | null }) => void;
}) {
  const [problem, setProblem] = useState<Record<string, string[]>>({});
  const submit = (f: FormData) => {
    const v = { partnerOneName: String(f.get("partnerOneName") ?? "").trim(), partnerTwoName: String(f.get("partnerTwoName") ?? "").trim(),
      weddingDate: String(f.get("weddingDate") ?? "") || null };
    const errors: Record<string, string[]> = {};
    if (!v.partnerOneName) errors.partnerOneName = ["Enter a name."];
    if (!v.partnerTwoName) errors.partnerTwoName = ["Enter a name."];
    setProblem(errors);
    if (!Object.keys(errors).length) onNext(v);
  };
  return (
    <form id="setup-couple" action={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Partner one" name="partnerOneName" required defaultValue={wedding.partnerOneName} errors={problem.partnerOneName} />
        <TextField label="Partner two" name="partnerTwoName" required defaultValue={wedding.partnerTwoName} errors={problem.partnerTwoName} />
      </div>
      <TextField label="Wedding date" name="weddingDate" type="date" defaultValue={wedding.weddingDate ?? ""} hint="You can add this later." />
    </form>
  );
}

function SectionsStep({ selected, onChange }: { selected: SectionType[]; onChange: (s: SectionType[]) => void }) {
  const toggle = (t: SectionType, on: boolean) => onChange(on ? [...selected, t] : selected.filter((x) => x !== t));
  return (
    <fieldset>
      <legend className="sr-only">Sections for your website</legend>
      <ul className="grid gap-3 sm:grid-cols-2">
        {OFFERED.map((o) => {
          const on = selected.includes(o.type);
          return (
            <li key={o.type}>
              <label className={cn("flex h-full cursor-pointer gap-3 rounded-2xl border-2 p-4 transition", on ? "border-pink-dark bg-blush" : "border-line hover:border-pink/60",
                o.required && "cursor-default")}>
                <input type="checkbox" className="mt-1 size-5 shrink-0 accent-[var(--color-pink-dark)]" checked={on} disabled={o.required}
                  onChange={(e) => toggle(o.type, e.target.checked)} aria-describedby={`sec-${o.type}`} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2 font-semibold">{o.label}{o.required ? <span className="text-xs font-normal text-mute">Always included</span> : null}</span>
                  <span id={`sec-${o.type}`} className="block text-sm text-mute">{o.required ? "Every wedding website shows its events, so this one stays on." : o.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function DoneStep({ weddingId, hasDesign }: { weddingId: string; hasDesign: boolean }) {
  const base = `/dashboard/weddings/${weddingId}`;
  return (
    <div className="space-y-5">
      <p>Your answers are saved in your draft. Sections you haven&apos;t filled in show sample content in the editor (marked &ldquo;Sample&rdquo;) until you add your own; they stay hidden on your live site.</p>
      {hasDesign ? null : (
        <Alert tone="warning" title="One thing left: choose a design"
          action={<LinkButton href={`${base}/design`} size="sm">Choose a design</LinkButton>}>
          You&apos;ll see and edit your website once it has a design.
        </Alert>
      )}
      <div>
        <h2 className="font-sans text-base font-semibold">What&apos;s next</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          <li className="flex flex-col rounded-2xl border border-line p-4">
            <p className="font-semibold">✎ Edit your website</p>
            <p className="mt-1 flex-1 text-sm text-mute">Tap any text or photo to change it, and show, hide or reorder sections.</p>
            <LinkButton href={`${base}/design`} size="sm" className="mt-4 self-start" variant={hasDesign ? "primary" : "secondary"}>Open the editor</LinkButton>
          </li>
          <li className="flex flex-col rounded-2xl border border-line p-4">
            <p className="font-semibold">🎨 Change the design</p>
            <p className="mt-1 flex-1 text-sm text-mute">Try another template or colours any time. Nothing you&apos;ve added is lost.</p>
            <LinkButton href={`${base}/design?panel=template`} size="sm" className="mt-4 self-start" variant="secondary">Change template</LinkButton>
          </li>
          <li className="flex flex-col rounded-2xl border border-line p-4">
            <p className="font-semibold">👀 See it as guests will</p>
            <p className="mt-1 flex-1 text-sm text-mute">A private preview on phone, tablet or desktop. Only you can see it.</p>
            <LinkButton href={`${base}/preview`} size="sm" className="mt-4 self-start" variant="secondary">Preview</LinkButton>
          </li>
        </ul>
        <p className="mt-3 text-xs text-mute">Later, find all of this under the <b>Edit &amp; design</b> tab of your wedding.</p>
      </div>
      <div className="border-t border-line pt-4">
        <Link href={base} className="text-sm font-semibold text-pink-dark underline-offset-4 hover:underline">Go to the dashboard →</Link>
      </div>
    </div>
  );
}

/** Short form for one section type (the essentials only; everything else is in the editor). */
function SectionStep({ type, content, register, weddingId }: { type: string; content: Content; register: (fn: Collect) => void; weddingId: string }) {
  switch (type) {
    case "story": return <StoryForm content={content} register={register} />;
    case "rsvp": return <RsvpForm content={content} register={register} />;
    case "welcome": return <WelcomeForm content={content} register={register} />;
    case "dress_code": case "travel": case "explore": return <ItemsForm type={type} content={content} register={register} />;
    case "wedding_party": return <PeopleForm content={content} register={register} />;
    case "faq": return <FaqForm content={content} register={register} />;
    case "registry": return <RegistryForm content={content} register={register} />;
    case "video": return <VideoForm content={content} register={register} weddingId={weddingId} />;
    default: return <p className="text-sm text-mute">Nothing to fill in here: this section uses your other details.</p>;
  }
}

type Chapter = { label: string | null; title: string; text: string | null; mediaId: string | null; alt: string | null };
type MomentDraft = Chapter & { key: string };
const MAX_MOMENTS = 12; // the API's limit
const blankMoment = (): MomentDraft => ({ key: newId("m"), label: null, title: "", text: null, mediaId: null, alt: null });
const momentFilled = (c: Chapter) => !!(c.title.trim() || (c.text ?? "").trim() || (c.label ?? "").trim() || c.mediaId);

function StoryForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const [body, setBody] = useState(txt(content.body));
  const [moments, setMoments] = useState<MomentDraft[]>(() => {
    const saved = arr<Chapter>(content.chapters).slice(0, MAX_MOMENTS).map((c) => ({ ...c, key: newId("m") }));
    return saved.length ? saved : [blankMoment()];
  });
  const [removing, setRemoving] = useState<string | null>(null);
  useCollect(register, () => {
    const filled = moments.filter(momentFilled);
    const missing = moments.findIndex((c) => momentFilled(c) && !c.title.trim());
    if (missing >= 0) return { patch: null, error: `Moment ${missing + 1} needs a title (or remove it).` };
    return { patch: { body: el(body), chapters: filled.map((c) => ({ label: c.label, title: c.title.trim(), text: c.text, mediaId: c.mediaId, alt: c.alt })) } };
  });
  const set = (key: string, patch: Partial<Chapter>) => setMoments((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const move = (i: number, by: number) => setMoments((cs) => {
    const next = [...cs]; const [m] = next.splice(i, 1); next.splice(i + by, 0, m); return next;
  });
  const remove = (key: string) => setMoments((cs) => cs.filter((c) => c.key !== key));
  return (
    <div className="space-y-5">
      <TextArea label="Your story" value={body} maxLength={4000} rows={4} placeholder="e.g. We met on the rainiest day of the year…" onChange={(e) => setBody(e.target.value)} />
      <div>
        <p className="text-sm font-semibold">Moments (optional)</p>
        <p className="text-sm text-mute">Milestones such as where you met or the proposal. Empty moments are left out.</p>
      </div>
      <ol className="space-y-4">
        {moments.map((c, i) => (
          <li key={c.key}>
            <fieldset className="space-y-3 rounded-2xl border border-line p-4">
              <legend className="sr-only">Moment {i + 1}</legend>
              <div className="-mt-1 flex items-center justify-between gap-2 border-b border-line pb-2">
                <p className="min-w-0 truncate text-sm font-semibold" aria-hidden="true">Moment {i + 1}{c.title.trim() ? <span className="hidden font-normal text-mute sm:inline"> · {c.title.trim()}</span> : null}</p>
                <span className="flex shrink-0 items-center">
                  <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move moment ${i + 1} up`}>↑</Button>
                  <Button size="sm" variant="ghost" disabled={i === moments.length - 1} onClick={() => move(i, 1)} aria-label={`Move moment ${i + 1} down`}>↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => (momentFilled(c) ? setRemoving(c.key) : remove(c.key))} aria-label={`Remove moment ${i + 1}`}>Remove</Button>
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                <TextField label="When / where" value={c.label ?? ""} maxLength={80} placeholder="e.g. 2019 · Kochi" onChange={(e) => set(c.key, { label: e.target.value || null })} />
                <TextField label="Title" value={c.title} maxLength={150} placeholder="e.g. A borrowed umbrella" onChange={(e) => set(c.key, { title: e.target.value })} />
              </div>
              <TextArea label="A few words" value={c.text ?? ""} maxLength={2000} rows={2} onChange={(e) => set(c.key, { text: e.target.value || null })} />
              <ImageField field={`chapters.${i}.image`} label="Photo (optional)" canHide={false}
                value={{ mediaId: c.mediaId, alt: c.alt, hidden: false }}
                onChange={(img) => set(c.key, { mediaId: img.mediaId ?? null, alt: img.alt ?? null })} />
            </fieldset>
          </li>
        ))}
      </ol>
      {moments.length < MAX_MOMENTS ? (
        <Button variant="secondary" onClick={() => setMoments((cs) => [...cs, blankMoment()])}>+ Add a moment</Button>
      ) : <p className="text-sm text-mute">You can add up to {MAX_MOMENTS} moments.</p>}
      <ConfirmDialog open={removing !== null} onClose={() => setRemoving(null)} title="Remove this moment?" confirmLabel="Remove moment"
        onConfirm={() => { if (removing) remove(removing); setRemoving(null); }}>
        <p>What you typed for this moment will be removed when you press Next.</p>
      </ConfirmDialog>
    </div>
  );
}

function RsvpForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const [deadline, setDeadline] = useState(typeof content.deadline === "string" ? content.deadline : "");
  const [plusOnes, setPlusOnes] = useState(typeof content.maxPlusOnes === "number" ? content.maxPlusOnes : 1);
  const [undecided, setUndecided] = useState(content.allowUndecided !== false);
  useCollect(register, () => ({ patch: { deadline: deadline || null, maxPlusOnes: plusOnes, allowUndecided: undecided } }));
  return (
    <div className="space-y-5">
      <TextField label="Reply by (optional)" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} hint="Guests can reply until the end of this day." />
      <SelectField label="Guests each person may bring" value={String(plusOnes)} onChange={(e) => setPlusOnes(Number(e.target.value))}>
        {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n === 0 ? "No extra guests" : n === 1 ? "1 guest" : `${n} guests`}</option>)}
      </SelectField>
      <Checkbox label="Offer a “Not sure yet” answer" checked={undecided} onChange={(e) => setUndecided(e.target.checked)} />
    </div>
  );
}

function WelcomeForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const [body, setBody] = useState(txt(content.body));
  const [signature, setSignature] = useState(txt(content.signature));
  useCollect(register, () => ({ patch: { body: el(body), signature: el(signature) } }));
  return (
    <div className="space-y-5">
      <TextArea label="Your note" value={body} maxLength={4000} rows={5} onChange={(e) => setBody(e.target.value)} />
      <TextField label="Signed" value={signature} maxLength={80} placeholder="e.g. With love," onChange={(e) => setSignature(e.target.value)} hint="Your names follow it." />
    </div>
  );
}

type Item = { label: string | null; title: string; text: string | null; url: string | null; linkLabel: string | null; mediaId: string | null; alt: string | null; colors?: string[] | null };
const ITEM_HINTS: Record<string, { label: string; title: string; text: string }> = {
  dress_code: { label: "Women · Men · Haldi…", title: "Elegant formal attire", text: "Pastels or jewel tones." },
  travel: { label: "Getting there", title: "Shuttle from the station", text: "Every 30 minutes from 9 AM." },
  explore: { label: "", title: "The old town", text: "Markets and the best coffee in the city." },
};

function ItemsForm({ type, content, register }: { type: string; content: Content; register: (fn: Collect) => void }) {
  const existing = arr<Item>(content.items);
  const blank: Item = { label: null, title: "", text: null, url: null, linkLabel: null, mediaId: null, alt: null, colors: [] };
  const [items, setItems] = useState<Item[]>(() => [0, 1, 2].map((i) => existing[i] ?? blank));
  useCollect(register, () => {
    const filled = items.filter((it) => it.title.trim() || (it.text ?? "").trim() || (it.label ?? "").trim());
    if (filled.some((it) => !it.title.trim())) return { patch: null, error: "Each item needs a title." };
    return { patch: { items: [...filled.map((it) => ({ ...it, title: it.title.trim() })), ...existing.slice(3)] } };
  });
  const hint = ITEM_HINTS[type];
  const set = (i: number, patch: Partial<Item>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <fieldset key={i} className="space-y-3 rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">{i === 0 ? "First" : i === 1 ? "Second (optional)" : "Third (optional)"}</legend>
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <TextField label={type === "dress_code" ? "For" : "Small label"} value={it.label ?? ""} maxLength={80} placeholder={hint.label ? `e.g. ${hint.label}` : undefined} onChange={(e) => set(i, { label: e.target.value || null })} />
            <TextField label="Title" value={it.title} maxLength={150} placeholder={`e.g. ${hint.title}`} onChange={(e) => set(i, { title: e.target.value })} />
          </div>
          <TextArea label="Details" value={it.text ?? ""} maxLength={2000} rows={2} placeholder={`e.g. ${hint.text}`} onChange={(e) => set(i, { text: e.target.value || null })} />
        </fieldset>
      ))}
    </div>
  );
}

type Person = { name: string; role: string | null; bio: string | null; mediaId: string | null };

function PeopleForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const existing = arr<Person>(content.members);
  const [people, setPeople] = useState<Person[]>(() => Array.from({ length: Math.max(4, existing.length) }, (_, i) => existing[i] ?? { name: "", role: null, bio: null, mediaId: null }));
  useCollect(register, () => {
    const filled = people.filter((p) => p.name.trim() || (p.role ?? "").trim());
    if (filled.some((p) => !p.name.trim())) return { patch: null, error: "Each person needs a name." };
    return { patch: { members: filled.map((p) => ({ ...p, name: p.name.trim() })) } };
  });
  const set = (i: number, patch: Partial<Person>) => setPeople((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-3">
      {people.map((p, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-2">
          <TextField label={`Person ${i + 1}: name`} value={p.name} maxLength={100} onChange={(e) => set(i, { name: e.target.value })} />
          <TextField label="Role" value={p.role ?? ""} maxLength={80} placeholder="e.g. Maid of honour" onChange={(e) => set(i, { role: e.target.value || null })} />
        </div>
      ))}
      {people.length < 12 ? <Button size="sm" variant="ghost" onClick={() => setPeople((xs) => [...xs, { name: "", role: null, bio: null, mediaId: null }])}>+ Add a person</Button> : null}
    </div>
  );
}

type Qa = { question: string; answer: string };

function FaqForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const existing = arr<Qa>(content.items);
  // One empty custom question to start with when there are none; preset questions are added from the list.
  const [items, setItems] = useState<Qa[]>(() => (existing.length ? existing : [{ question: "", answer: "" }]));
  useCollect(register, () => {
    const filled = items.filter((q) => q.question.trim() || q.answer.trim());
    if (filled.some((q) => !q.question.trim() || !q.answer.trim())) return { patch: null, error: "Each question needs an answer." };
    return { patch: { items: filled } };
  });
  const set = (i: number, patch: Partial<Qa>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const add = (question: string) => setItems((xs) => {
    // Fill an untouched empty row first, so a preset doesn't leave a blank one above it.
    const blank = xs.findIndex((x) => !x.question.trim() && !x.answer.trim());
    return blank >= 0 ? xs.map((x, j) => (j === blank ? { question, answer: "" } : x)) : [...xs, { question, answer: "" }];
  });
  return (
    <div className="space-y-4">
      <FaqPresetPicker questions={items.map((q) => q.question)} onAdd={add} full={items.length >= 30} />
      {items.map((q, i) => (
        <fieldset key={i} className="relative space-y-3 rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Question {i + 1}</legend>
          <Button size="sm" variant="ghost" className="absolute right-2 top-1" aria-label={`Remove question ${i + 1}`} onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>✕ Remove</Button>
          <TextField label="Question" value={q.question} maxLength={200} placeholder="e.g. Can I bring a plus-one?" onChange={(e) => set(i, { question: e.target.value })} />
          <TextArea label="Answer" value={q.answer} maxLength={2000} rows={2} placeholder={faqSample(q.question)} onChange={(e) => set(i, { answer: e.target.value })} />
        </fieldset>
      ))}
      {items.length < 30 ? <Button size="sm" variant="secondary" onClick={() => setItems((xs) => [...xs, { question: "", answer: "" }])}>＋ Add your own question</Button> : null}
    </div>
  );
}

type RegistryLink = { label: string; url: string; description: string | null };

function RegistryForm({ content, register }: { content: Content; register: (fn: Collect) => void }) {
  const existing = arr<RegistryLink>(content.links);
  const [links, setLinks] = useState<RegistryLink[]>(() => [0, 1].map((i) => existing[i] ?? { label: "", url: "", description: null }));
  useCollect(register, () => {
    const filled = links.filter((l) => l.label.trim() || l.url.trim());
    if (filled.some((l) => !l.label.trim() || !httpsOk(l.url))) return { patch: null, error: "Each link needs a name and an https:// address." };
    return { patch: { links: [...filled.map((l) => ({ ...l, url: l.url.trim() })), ...existing.slice(2)] } };
  });
  const set = (i: number, patch: Partial<RegistryLink>) => setLinks((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-4">
      {links.map((l, i) => (
        <fieldset key={i} className="space-y-3 rounded-2xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Link {i + 1}{i > 0 ? " (optional)" : ""}</legend>
          <TextField label="Name" value={l.label} maxLength={100} placeholder="e.g. Our honeymoon fund" onChange={(e) => set(i, { label: e.target.value })} />
          <TextField label="Address" type="url" inputMode="url" value={l.url} maxLength={2048} placeholder="https://…" onChange={(e) => set(i, { url: e.target.value })} />
          <TextField label="A few words (optional)" value={l.description ?? ""} maxLength={300} onChange={(e) => set(i, { description: e.target.value || null })} />
        </fieldset>
      ))}
    </div>
  );
}

function VideoForm({ content, register, weddingId }: { content: Content; register: (fn: Collect) => void; weddingId: string }) {
  const [title, setTitle] = useState(txt(content.heading));
  const [description, setDescription] = useState(txt(content.body));
  const initial = (content.video ?? {}) as { videoMediaId?: string | null; posterMediaId?: string | null };
  const [video, setVideo] = useState({ videoMediaId: initial.videoMediaId ?? null, posterMediaId: initial.posterMediaId ?? null });
  useCollect(register, () => (!title.trim()
    ? { patch: null, error: "Give the video a title." }
    : { patch: { heading: el(title), body: el(description), video } }));
  const [, start] = useTransition();
  return (
    <div className="space-y-5">
      <TextField label="Title" required value={title} maxLength={150} placeholder="e.g. Our story on film" onChange={(e) => setTitle(e.target.value)} />
      <TextArea label="Description (optional)" value={description} maxLength={1000} rows={3} onChange={(e) => setDescription(e.target.value)} />
      <VideoField field="video" videoMediaId={video.videoMediaId} posterMediaId={video.posterMediaId}
        onChange={(next) => {
          setVideo(next);
          // Saved straight away, so an uploaded video is never lost if they leave this step.
          start(async () => { await saveSetupSectionAction(weddingId, "video", { heading: el(title || "Our video"), body: el(description), video: next }); });
        }} />
    </div>
  );
}

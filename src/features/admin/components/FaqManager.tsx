"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Badge, Button, Checkbox, ConfirmDialog, EmptyState, Modal, TextArea, TextField } from "@/components/ui";
import { SortableList } from "@/features/editor/SortableList";
import { deleteFaqAction, reorderFaqsAction, saveFaqAction } from "../actions";
import type { Faq } from "../types";

type Draft = { id: string | null; question: string; answer: string; isPublished: boolean };

export function FaqManager({ faqs: initial, isAdmin }: { faqs: Faq[]; isAdmin: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState<string[] | null>(null);
  const faqs = order ? order.map((id) => initial.find((f) => f.id === id)!).filter(Boolean) : initial;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Faq | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, done: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { setError(null); done(); setOrder(null); router.refresh(); } else setError(r.error?.message ?? "Something went wrong.");
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {isAdmin ? <Button onClick={() => { setError(null); setDraft({ id: null, question: "", answer: "", isPublished: true }); }}>＋ Add a question</Button> : null}
        <span role="status" aria-live="polite" className="text-sm text-success">{notice}</span>
      </div>
      {error && !draft && !deleting ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      {faqs.length === 0 ? <EmptyState title="No FAQs yet">The home page hides its FAQ section until you add one.</EmptyState> : (
        <SortableList items={faqs} getId={(f) => f.id} getLabel={(f) => f.question} disabled={!isAdmin || pending} className="space-y-2"
          onReorder={(ids) => { setOrder(ids); run(() => reorderFaqsAction(ids), () => setNotice("Order saved.")); }}
          renderItem={(f, c) => (
            <div className="flex flex-wrap items-start gap-3 rounded-[18px] border border-line bg-white p-3 sm:flex-nowrap">
              {c.handle}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{f.question} {f.isPublished ? null : <Badge tone="neutral" className="ml-1">Not published</Badge>}</p>
                <p className="line-clamp-2 text-sm text-mute">{f.answer}</p>
              </div>
              {c.arrows}
              {isAdmin ? (
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => { setError(null); setDraft({ id: f.id, question: f.question, answer: f.answer, isPublished: f.isPublished }); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => { setError(null); setDeleting(f); }}>Delete</Button>
                </div>
              ) : null}
            </div>
          )} />
      )}

      <Modal open={draft !== null} onClose={() => setDraft(null)} title={draft?.id ? "Edit question" : "Add a question"}>
        {draft ? (
          <div className="space-y-4">
            <TextField label="Question" value={draft.question} maxLength={200} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
            <TextArea label="Answer" value={draft.answer} maxLength={2000} rows={5} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
            <Checkbox label="Show it on the home page" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} />
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button loading={pending} disabled={!draft.question.trim() || !draft.answer.trim()}
                onClick={() => run(() => saveFaqAction(draft.id, draft), () => { setNotice(draft.id ? "Question saved." : "Question added."); setDraft(null); })}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending} title="Delete this question?" confirmLabel="Delete"
        onConfirm={() => deleting && run(() => deleteFaqAction(deleting.id), () => { setDeleting(null); setNotice("Question deleted."); })}>
        <p>&ldquo;{deleting?.question}&rdquo; will be removed from the home page. To keep it for later, untick &ldquo;Show it on the home page&rdquo; instead.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}

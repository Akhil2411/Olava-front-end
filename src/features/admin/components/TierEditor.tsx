"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Badge, Button, ConfirmDialog, Modal, Switch, TextArea, TextField } from "@/components/ui";
import { formatMoney } from "@/lib/utils/format";
import { deleteTierAction, saveTierAction } from "../actions";
import type { AdminTier, TierInput } from "../types";

const blank: TierInput = { code: "", name: "", description: "", rank: 1, priceMinor: 0, features: [], liveMonthsAfterWedding: 12,
  maxLiveMonthsFromPurchase: 24, minLiveDaysFromPurchase: 30, isActive: true };

/** Package cards with edit / add / delete (delete only for packages nobody bought and no template uses). */
export function TierEditor({ tiers, isAdmin }: { tiers: AdminTier[]; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: string | null; value: TierInput } | null>(null);
  const [deleting, setDeleting] = useState<AdminTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<TierInput>) => setEditing((e) => (e ? { ...e, value: { ...e.value, ...patch } } : e));

  const save = () => start(async () => {
    if (!editing) return;
    const r = await saveTierAction(editing.id, editing.value);
    if (r.ok) { setEditing(null); setError(null); router.refresh(); } else setError(r.error.message);
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((t) => (
          <article key={t.id} className="flex flex-col rounded-[20px] border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-2xl">{t.name}</h2>
                <p className="text-xs text-mute">Code <code>{t.code}</code> · level {t.rank}</p>
              </div>
              {t.isActive ? <Badge tone="success">On sale</Badge> : <Badge tone="neutral">Turned off</Badge>}
            </div>
            <p className="mt-3 font-serif text-4xl text-pink-dark">{formatMoney(t.priceMinor, t.currency)}</p>
            {t.description ? <p className="mt-2 text-sm text-mute">{t.description}</p> : null}
            <ul className="mt-3 space-y-1 text-sm">{t.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
            <p className="mt-3 text-xs text-mute">
              Live until {t.liveMonthsAfterWedding} months after the wedding (at most {t.maxLiveMonthsFromPurchase} months from purchase, at least {t.minLiveDaysFromPurchase} days).
            </p>
            <p className="mt-1 text-xs text-mute">{t.templates} templates · bought for {t.purchases} weddings</p>
            {isAdmin ? (
              <div className="mt-auto flex gap-2 pt-4">
                <Button size="sm" variant="secondary" onClick={() => { setError(null); setEditing({ id: t.id, value: { ...t, description: t.description ?? "" } }); }}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => { setError(null); setDeleting(t); }}>Delete</Button>
              </div>
            ) : null}
          </article>
        ))}
        {isAdmin ? (
          <button type="button" onClick={() => { setError(null); setEditing({ id: null, value: { ...blank, rank: Math.max(0, ...tiers.map((t) => t.rank)) + 1 } }); }}
            className="grid min-h-48 place-items-center rounded-[20px] border-2 border-dashed border-line text-sm font-semibold text-pink-dark hover:border-pink/60 hover:bg-blush">
            ＋ Add a package
          </button>
        ) : null}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit package" : "Add a package"} wide>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" value={editing.value.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
            <TextField label="Code" value={editing.value.code} disabled={editing.id !== null} maxLength={31} hint="Lower-case letters, numbers and dashes. Can't change later."
              onChange={(e) => set({ code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
            <TextField label="Price (₹)" type="number" min={0} step={1} value={String(editing.value.priceMinor / 100)}
              hint="Charged once per wedding. Applies to new purchases only." onChange={(e) => set({ priceMinor: Math.round(Number(e.target.value || 0) * 100) })} />
            <TextField label="Level" type="number" min={1} max={99} value={String(editing.value.rank)}
              hint="Higher = more expensive. A package unlocks templates of its level and below; upgrades pay the difference."
              onChange={(e) => set({ rank: Number(e.target.value || 1) })} />
            <TextArea label="Description" wrapperClassName="sm:col-span-2" value={editing.value.description ?? ""} maxLength={300} rows={2} onChange={(e) => set({ description: e.target.value })} />
            <TextArea label="What's included (one per line)" wrapperClassName="sm:col-span-2" rows={5} value={editing.value.features.join("\n")}
              onChange={(e) => set({ features: e.target.value.split("\n") })} />
            <TextField label="Live for (months after the wedding)" type="number" min={1} max={60} value={String(editing.value.liveMonthsAfterWedding)} onChange={(e) => set({ liveMonthsAfterWedding: Number(e.target.value || 1) })} />
            <TextField label="At most (months from purchase)" type="number" min={1} max={120} value={String(editing.value.maxLiveMonthsFromPurchase)} onChange={(e) => set({ maxLiveMonthsFromPurchase: Number(e.target.value || 1) })} />
            <TextField label="At least (days from purchase)" type="number" min={0} max={3650} value={String(editing.value.minLiveDaysFromPurchase)} onChange={(e) => set({ minLiveDaysFromPurchase: Number(e.target.value || 0) })} />
            <div className="flex items-end pb-2"><Switch label="On sale" checked={editing.value.isActive} onChange={(v) => set({ isActive: v })} /></div>
            {error ? <Alert tone="error" className="sm:col-span-2">{error}</Alert> : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button loading={pending} onClick={save}>{editing.id ? "Save package" : "Add package"}</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} busy={pending} title={`Delete ${deleting?.name}?`} confirmLabel="Delete package"
        onConfirm={() => start(async () => {
          if (!deleting) return;
          const r = await deleteTierAction(deleting.id);
          if (r.ok) { setDeleting(null); router.refresh(); } else setError(r.error.message);
        })}>
        <p>Only a package that no template uses and nobody has bought can be deleted. Otherwise turn it off instead (it stops being sold).</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}

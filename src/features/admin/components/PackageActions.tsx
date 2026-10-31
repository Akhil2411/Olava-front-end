"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, ConfirmDialog, Modal, SelectField, TextArea, TextField } from "@/components/ui";
import { blockSiteAction, cancelPackageAction, extendPackageAction, grantPackageAction, unblockSiteAction } from "../actions";
import type { AdminTier } from "../types";

/** A wedding's package and site: grant, extend, cancel, take offline / restore. Destructive ones are confirmed. */
export function PackageActions({ weddingId, wedding, hasPackage, tiers, isAdmin, blocked, compact = true }: {
  weddingId: string; wedding: string; hasPackage: boolean; tiers: AdminTier[]; isAdmin: boolean; blocked: boolean; compact?: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "grant" | "extend" | "cancel" | "block" | "unblock">(null);
  const [tier, setTier] = useState(tiers.find((t) => t.isActive)?.code ?? "");
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const close = () => { setDialog(null); setNote(""); setError(null); };
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>) => start(async () => {
    const r = await fn();
    if (r.ok) { close(); router.refresh(); } else setError(r.error?.message ?? "Something went wrong.");
  });
  const size = compact ? "sm" : "md";

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Giving packages away, extending and cancelling them is for admins only (the server checks too). */}
      {isAdmin ? <Button size={size} variant="ghost" onClick={() => setDialog("grant")}>{hasPackage ? "Change package" : "Grant package"}</Button> : null}
      {hasPackage && isAdmin ? <Button size={size} variant="ghost" onClick={() => setDialog("extend")}>Extend</Button> : null}
      {hasPackage && isAdmin ? <Button size={size} variant="ghost" className="text-danger" onClick={() => setDialog("cancel")}>Cancel package</Button> : null}
      {blocked
        ? <Button size={size} variant="ghost" onClick={() => setDialog("unblock")}>Restore site</Button>
        : <Button size={size} variant="ghost" className="text-danger" onClick={() => setDialog("block")}>Take offline</Button>}

      <Modal open={dialog === "grant"} onClose={close} title={`${hasPackage ? "Change" : "Grant"} package: ${wedding}`}>
        <div className="space-y-4">
          <p className="text-sm text-mute">No payment is taken. If their package has expired, a new live period starts today.</p>
          <SelectField label="Package" value={tier} onChange={(e) => setTier(e.target.value)}>
            {tiers.map((t) => <option key={t.code} value={t.code}>{t.name}{t.isActive ? "" : " (turned off)"}</option>)}
          </SelectField>
          <TextArea label="Note (why; kept in the activity log)" value={note} maxLength={300} rows={2} onChange={(e) => setNote(e.target.value)} />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={close}>Cancel</Button>
            <Button loading={pending} onClick={() => run(() => grantPackageAction(weddingId, tier, note))}>Grant</Button></div>
        </div>
      </Modal>

      <Modal open={dialog === "extend"} onClose={close} title={`Extend live period: ${wedding}`}>
        <div className="space-y-4">
          <TextField label="Keep the site live until" type="date" value={until} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setUntil(e.target.value)}
            hint="Replaces the date worked out from the wedding date." />
          <TextArea label="Note (kept in the activity log)" value={note} maxLength={300} rows={2} onChange={(e) => setNote(e.target.value)} />
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={close}>Cancel</Button>
            <Button loading={pending} disabled={!until} onClick={() => run(() => extendPackageAction(weddingId, until, note))}>Extend</Button></div>
        </div>
      </Modal>

      <ConfirmDialog open={dialog === "cancel"} onClose={close} busy={pending} title={`Cancel the package for ${wedding}?`} confirmLabel="Cancel package"
        onConfirm={() => run(() => cancelPackageAction(weddingId, note))}>
        <p>The live site goes offline straight away and they&apos;d need to buy a package again. Payments aren&apos;t refunded here (do that in Razorpay).</p>
        <TextArea label="Note (kept in the activity log)" value={note} maxLength={300} rows={2} onChange={(e) => setNote(e.target.value)} />
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "block"} onClose={close} busy={pending} title={`Take ${wedding} offline?`} confirmLabel="Take offline"
        onConfirm={() => run(() => blockSiteAction(weddingId, note))}>
        <p>Guests will see &quot;unavailable&quot;, and the couple can&apos;t republish until you restore it. Their package and content are kept.</p>
        <TextArea label="Reason (kept in the activity log)" value={note} required maxLength={500} rows={2} onChange={(e) => setNote(e.target.value)} />
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "unblock"} onClose={close} busy={pending} title={`Restore ${wedding}?`} confirmLabel="Restore"
        onConfirm={() => run(() => unblockSiteAction(weddingId))}>
        <p>The site comes back online (if it&apos;s published and its package is live), and the couple can publish again.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </div>
  );
}

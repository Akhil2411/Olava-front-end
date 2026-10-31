"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

/** Confirmation for destructive actions. Optionally requires typing a phrase (e.g. the web address). */
export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = "Confirm", requireText, busy }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; children: ReactNode;
  confirmLabel?: string; requireText?: string; busy?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const ok = !requireText || typed.trim().toLowerCase() === requireText.toLowerCase();
  return (
    <Modal open={open} onClose={() => { setTyped(""); onClose(); }} title={title}>
      <div className="space-y-4 text-sm text-mute">{children}</div>
      {requireText ? (
        <label className="mt-4 block text-sm font-semibold">
          Type <span className="font-mono text-danger">{requireText}</span> to confirm
          <input
            className="mt-1.5 w-full rounded-[14px] border-[1.5px] border-line bg-white px-4 py-3 font-normal outline-none focus:border-danger"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </label>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={!ok} loading={busy}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

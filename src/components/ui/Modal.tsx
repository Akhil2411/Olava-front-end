"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Accessible modal built on <dialog>: focus is trapped by the browser, Escape closes it,
 * and focus returns to the trigger when it closes.
 */
export function Modal({ open, onClose, title, children, className, wide }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; className?: string; wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Unique per dialog: a dialog opened over another ("No venue selected" over "Add event") keeps its own name.
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Only this dialog's own events: React also delivers close/cancel from dialogs nested inside it.
      onClose={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onCancel={(e) => { if (e.target !== e.currentTarget) return; e.preventDefault(); onClose(); }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-[22px] border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-ink/50",
        wide ? "max-w-4xl" : "max-w-lg",
        className,
      )}
      aria-labelledby={titleId}
    >
      {open ? (
        <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-2xl">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-xl leading-none text-mute hover:bg-tint" aria-label="Close">
              ×
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

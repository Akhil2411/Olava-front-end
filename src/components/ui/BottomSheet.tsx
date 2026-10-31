"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile bottom sheet built on a modal <dialog>: focus is trapped by the browser, Escape closes it and
 * focus returns to the element that opened it. The page behind stays visible above the sheet.
 */
export function BottomSheet({ open, onClose, title, children, footer, className }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; className?: string;
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
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // tap on the backdrop
      aria-labelledby={titleId}
      className={cn(
        "fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[65dvh] w-full max-w-2xl rounded-t-[26px] border border-line bg-white p-0 text-ink shadow-2xl",
        "backdrop:bg-ink/30 open:flex open:flex-col",
        className,
      )}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 pb-3 pt-2">
            <span aria-hidden="true" className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
            <h2 id={titleId} className="mt-3 text-xl">{title}</h2>
            <button type="button" onClick={onClose} className="mt-2 rounded-full px-3 py-1 text-sm font-semibold text-pink-dark hover:bg-tint">Done</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer ? <div className="border-t border-line px-5 py-3">{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}

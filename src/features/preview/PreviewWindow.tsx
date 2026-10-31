"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DeviceStage, DeviceSwitch, shownDevice, sizeNote, useScreenDevices, type Device } from "./DeviceStage";

/**
 * Full-size live preview window: the website in a real-size device frame (Mobile / Tablet / Desktop, as this
 * screen allows), scaled to fit. On a phone it fills the screen with no device choice. Used by the template
 * gallery, the template picker, the walkthrough's design step and the editor's Preview button.
 */
export function PreviewWindow({ open, title, src, note, action, children, onClose, initialDevice = "mobile" }: {
  open: boolean; title: string; src: string; note?: ReactNode;
  /** The main button (e.g. "Use this template"), in the top bar so it's always visible. */
  action?: ReactNode;
  /** Extra content under the preview (e.g. an upgrade notice). */
  children?: ReactNode;
  onClose: () => void;
  initialDevice?: Device;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { devices } = useScreenDevices();
  const [chosen, setChosen] = useState<Device>(initialDevice);
  const [scale, setScale] = useState(1);
  const full = devices.length === 0;
  const device = full ? "mobile" : shownDevice(chosen, devices);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => { setChosen(initialDevice); onClose(); };

  return (
    <dialog ref={ref} aria-labelledby={titleId}
      onClose={(e) => { if (e.target === e.currentTarget) close(); }}
      onCancel={(e) => { if (e.target !== e.currentTarget) return; e.preventDefault(); close(); }}
      className={cn("m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/50",
        "sm:m-auto sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] lg:h-[calc(100dvh-3rem)] lg:w-[calc(100vw-5rem)]")}>
      {open ? (
        <div className="flex h-full flex-col bg-white p-3 sm:rounded-[22px] sm:p-5" data-preview-window>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id={titleId} className="min-w-0 flex-1 truncate text-xl sm:flex-none sm:text-2xl">{title}</h2>
            <DeviceSwitch devices={devices} value={device} onChange={setChosen} className="order-last w-full justify-center sm:order-none sm:w-auto" />
            <span className="hidden flex-1 sm:block" />
            {action ? <div className="shrink-0">{action}</div> : null}
            <button type="button" onClick={close} className="shrink-0 rounded-full px-2 py-1 text-2xl leading-none text-mute hover:bg-tint" aria-label="Close">×</button>
          </div>
          <DeviceStage src={src} title={title} device={device} full={full} onScale={setScale} className="mt-3 min-h-0 flex-1" />
          {note || !full ? (
            <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-mute">
              {note ? <p className="min-w-0 flex-1">{note}</p> : <span />}
              {!full ? <p className="tabular-nums" data-size-note>{sizeNote(device, scale)}</p> : null}
            </div>
          ) : null}
          {children ? <div className="mt-3 max-h-[30%] shrink-0 overflow-y-auto">{children}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

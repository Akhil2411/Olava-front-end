"use client";

import { useState } from "react";
import { DeviceStage, DeviceSwitch, shownDevice, sizeNote, useScreenDevices, type Device } from "./DeviceStage";

/**
 * The private draft (/preview/{id}) in a real-size device frame, scaled to fit. A computer offers Mobile,
 * Tablet and Desktop, a tablet Mobile and Tablet; on a phone the preview simply fills the width.
 */
export function DevicePreview({ src }: { src: string }) {
  const { devices } = useScreenDevices();
  const [chosen, setChosen] = useState<Device>("mobile");
  const [scale, setScale] = useState(1);
  const full = devices.length === 0;
  const device = full ? "mobile" : shownDevice(chosen, devices);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <DeviceSwitch devices={devices} value={device} onChange={setChosen} />
        {!full ? <span className="text-xs tabular-nums text-mute" data-size-note>{sizeNote(device, scale)}</span> : null}
        <a href={src} target="_blank" rel="noopener" className="ml-auto text-sm font-medium text-pink-dark underline-offset-4 hover:underline">Open full screen ↗</a>
      </div>
      <DeviceStage src={src} title="Website preview" device={device} full={full} onScale={setScale}
        className={full ? "h-[calc(100dvh-9rem)] min-h-[480px] rounded-[14px] border border-line" : "h-[max(520px,calc(100dvh-21rem))]"} />
    </div>
  );
}
